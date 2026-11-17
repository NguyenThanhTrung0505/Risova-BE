import jwt from "jsonwebtoken";
import { UnAuthorizedException } from "./error.helper";

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnAuthorizedException("Bạn chưa đăng nhập!");
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; //thông tin
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
