import { statusCodes } from "./statusCode.helper";

export const responseSuccess = (
    data = null,
    message = "OK",
    statusCode = statusCodes.OK,
) => {
    return {
        status: `success`,
        message: message,
        statusCode: statusCode,
        data: data,
    };
};

export const responseError = (
    message = "Internal Server Error",
    statusCode = statusCodes.INTERNAL_SERVER_ERROR,
    stack = null,
) => {
    return {
        status: "error",
        statusCode: statusCode,
        message: message,
        stack: stack,
    };
};
