import { AppError } from "../helpers/error.helper.js";
import { statusCodes } from "../helpers/statusCode.helper.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return next(
                new AppError(
                    "Không xác định được quyền truy cập",
                    statusCodes.UNAUTHORIZED,
                ),
            );
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Chức năng này yêu cầu quyền: ${allowedRoles.join(", ")}`,
                    statusCodes.FORBIDDEN,
                ),
            );
        }
        next();
    };
};
