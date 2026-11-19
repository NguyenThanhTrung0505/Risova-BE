import jwt from "jsonwebtoken";
import { UnAuthorizedException } from "./error.helper";
import authRepository from "../../repository/auth.repository.js";

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnAuthorizedException("Bạn chưa đăng nhập!");
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await authRepository.findUserById(decoded.id);
        if (!user || !user.isActive) {
            throw new UnAuthorizedException(
                "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!",
            );
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        };
        next();
    } catch (error) {
        if (error instanceof UnAuthorizedException) {
            return next(error);
        }
        return next(
            new UnAuthorizedException("Token không hợp lệ hoặc đã hết hạn!"),
        );
    }
};

export default verifyToken;
