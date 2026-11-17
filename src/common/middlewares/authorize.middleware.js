import {
    ForbiddenException,
    UnAuthorizedException,
} from "../helpers/error.helper.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            throw new UnAuthorizedException(
                "Không xác định được quyền truy cập",
            );
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenException(
                `Chức năng này yêu cầu quyền: ${allowedRoles.join(", ")}`,
            );
        }
        next();
    };
};
