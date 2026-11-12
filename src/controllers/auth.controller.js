import { responseSuccess } from "../common/helpers/response.helper.js";
import authService from "../services/auth.service.js";

const authController = {
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    message: "Vui lòng nhập email và mật khẩu!",
                });
            }
            const results = await authService.login(req.body);
            const resData = responseSuccess(results);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
    register: async (req, res, next) => {
        const results = await authService.register(req.body);
        const resData = responseSuccess(results);
        res.status(resData.statusCode).json(resData);
    },
    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            await authService.forgotPassword(email);
            if (!email) {
                return res.status(400).json({
                    message: "Vui lòng nhập email!",
                });
            }
            res.status(200).json({
                message: "Nếu email tồn tại, mã OTP sẽ được gửi.",
            });
        } catch (error) {
            next(error);
        }
    },
    verifyOtp: async (req, res, next) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp)
                return res.status(400).json({ message: "Thiếu thông tin!" });
            const { resetToken } = await authService.verifyOtp({ email, otp });
            res.status(200).json({
                message: "Xác thực OTP thành công",
                data: { resetToken },
            });
        } catch (error) {
            next(error);
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            const { resetToken, newPassword } = req.body;
            if (!resetToken || !newPassword)
                return res.status(400).json({ message: "Thiếu thông tin!" });
            await authService.resetPassword({ resetToken, newPassword });
            res.status(200).json({ message: "Đổi mật khẩu thành công!" });
        } catch (error) {
            next(error);
        }
    },
};

export default authController;
