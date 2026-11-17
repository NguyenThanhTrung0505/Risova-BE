import { responseError } from "./response.helper";
import { statusCodes } from "./statusCode.helper";
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(message, statusCode = statusCodes.BAD_REQUEST, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

// Không tìm thấy tài nguyên
export class NotFoundException extends Error {
    constructor(message = "NotFoundException") {
        super(message);
        this.statusCode = statusCodes.NOT_FOUND;
    }
}

// refresh token || không đủ quyền
export class ForbiddenException extends Error {
    constructor(message = "ForbiddenException") {
        super(message);
        this.statusCode = statusCodes.FORBIDDEN;
    }
}

// logout || chưa xác thực
export class UnAuthorizedException extends Error {
    constructor(message = "UnAuthorizedException") {
        super(message);
        this.statusCode = statusCodes.UNAUTHORIZED;
    }
}

const errorHandler = (err, req, res, next) => {
    if (err instanceof ZodError) {
        const resErr = responseError("Dữ liệu không hợp lệ", 400, err?.stack);
        return res.status(resErr.statusCode).json(resErr);
    }
    if (err.code === "23505") {
        const resErr = responseError(
            "Dữ liệu đã tồn tại (trùng mã hoặc giá trị duy nhất)",
            409,
            err?.stack,
        );
        return res.status(resErr.statusCode).json(resErr);
    }
    if (err.code === "23503") {
        const resErr = responseError(
            "Dữ liệu tham chiếu không tồn tại hoặc đang được sử dụng",
            400,
            err?.stack,
        );
        return res.status(resErr.statusCode).json(resErr);
    }
    if (err.code === "23514") {
        const resErr = responseError(
            `Vi phạm ràng buộc dữ liệu: ${err.constraint || err.message}`,
            400,
            err?.stack,
        );
        return res.status(resErr.statusCode).json(resErr);
    }
    const resErr = responseError(err?.message, err?.statusCode, err?.stack);
    return res.status(resErr.statusCode).json(resErr);
};
export default errorHandler;
