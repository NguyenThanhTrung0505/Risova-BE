import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authRepository from "../repository/auth.repository.js";
import crypto from "crypto";
import transporter from "../common/helpers/mailer.helper.js";
const hashOtp = (otp) =>
    crypto
        .createHmac("sha256", process.env.OTP_SECRET)
        .update(otp)
        .digest("hex");
const authService = {
    login: async (data) => {
        const user = await authRepository.findUser(data.email);
        if (!user) {
            const error = new Error("Tài khoản không tồn tại");
            error.statusCode = 404;
            throw error;
        }
        const isPasswordValid = await bcrypt.compare(
            data.password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            const error = new Error("Email hoặc mật khẩu không chính xác!");
            error.statusCode = 401;
            throw error;
        }
        if (!user.isActive) {
            const error = new Error("Tài khoản đã bị vô hiệu hóa!");
            error.statusCode = 403;
            throw error;
        }
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d",
            },
        );
        return { user, token };
    },
    register: async (data) => {
        const passwordHash = await bcrypt.hash(data.password, 10);
        const userData = {
            ...data,
            password_hash: passwordHash,
        };
        const result = await authRepository.register(userData);
        console.log(result);
        return data;
    },
    forgotPassword: async (email) => {
        const user = await authRepository.findUser(email);
        if (!user || !user.isActive) return;
        const existing = await authRepository.findPasswordForget(user.id);
        if (
            existing &&
            Date.now() - new Date(existing.lastSentAt).getTime() < 60 * 1000
        ) {
            const error = new Error("Vui lòng chờ 60 giây trước khi gửi lại");
            error.statusCode = 429;
            throw error;
        }
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = hashOtp(otp);
        await authRepository.saveOtp({
            userId: user.id,
            tokenHash: otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Xác nhận đặt lại mật khẩu CMMS",
            html: `
                <h2>Xác nhận đặt lại mật khẩu</h2>
                <p>Mã OTP của bạn là:</p>
                <h1>${otp}</h1>
                <p>Mã có hiệu lực trong 5 phút.</p>
                <p>Không chia sẻ mã này với bất kỳ ai.</p>
            `,
        });
    },
    verifyOtp: async ({ email, otp }) => {
        const invalid = () => {
            const error = new Error("OTP không hợp lệ hoặc đã hết hạn");
            error.statusCode = 400;
            return error;
        };
        const user = await authRepository.findUser(email);
        if (!user) throw invalid();
        const record = await authRepository.findPasswordForget(user.id);
        if (!record || record.isUsed || new Date(record.expiresAt) < new Date())
            throw invalid();

        if (record.failedAttempts >= 5) {
            const error = new Error(
                "Bạn đã nhập sai quá nhiều lần, vui lòng yêu cầu mã mới",
            );
            error.statusCode = 429;
            throw error;
        }
        const a = Buffer.from(hashOtp(otp));
        const b = Buffer.from(record.tokenHash);
        const match = a.length === b.length && crypto.timingSafeEqual(a, b);

        if (!match) {
            await authRepository.increaseFailedAttempts(record);
            throw invalid();
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        await authRepository.saveResetToken(user.id, {
            resetTokenHash: crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex"),
            resetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        return { resetToken };
    },
    resetPassword: async ({ resetToken, newPassword }) => {
        const invalid = () => {
            const error = new Error(
                "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
            );
            error.statusCode = 400;
            return error;
        };

        const tokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        const record = await authRepository.findByResetTokenHash(tokenHash);

        if (
            !record ||
            !record.resetExpiresAt ||
            new Date(record.resetExpiresAt) < new Date()
        ) {
            throw invalid();
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await authRepository.updatePassword(record.userId, passwordHash);
        await authRepository.deleteByUserId(record.userId);
    },
};

export default authService;
