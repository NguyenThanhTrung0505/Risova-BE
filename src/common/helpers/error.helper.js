import { statusCodes } from "./statusCode.helper";
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(message, statusCode = statusCodes.BAD_REQUEST, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

const errorHandler = (err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(statusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: statusCodes.BAD_REQUEST,
            message: "Dữ liệu đầu vào không hợp lệ",
            errors: err.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
    }
    if (err.code === "23505") {
        return res.status(statusCodes.CONFLICT).json({
            status: "error",
            statusCode: statusCodes.CONFLICT,
            message: "Dữ liệu đã tồn tại (trùng mã hoặc giá trị duy nhất)",
        });
    }
    if (err.code === "23503") {
        return res.status(statusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: statusCodes.BAD_REQUEST,
            message: "Dữ liệu tham chiếu không tồn tại hoặc đang được sử dụng",
        });
    }
    if (err.code === "23514") {
        return res.status(statusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: statusCodes.BAD_REQUEST,
            message: `Vi phạm ràng buộc dữ liệu: ${err.constraint || err.message}`,
        });
    }

    const statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({
        status: "error",
        statusCode,
        message: err.message || "Lỗi hệ thống",
        ...(err.errors && { errors: err.errors }),
    });
};
export default errorHandler;
