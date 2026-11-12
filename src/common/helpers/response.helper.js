export const responseSuccess = (
    data = null,
    message = "OK",
    statusCode = 200,
) => {
    return {
        status: `success`,
        message: message,
        statusCode: statusCode,
        data: data,
    };
};
