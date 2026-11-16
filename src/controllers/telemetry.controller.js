import { responseSuccess } from "../common/helpers/response.helper.js";
import telemetryService from "../services/telemetry.service.js";

const telemetryController = {
    ingest: async (req, res, next) => {
        try {
            const data = await telemetryService.ingestTelemetry(
                req.body,
                req.user,
            );
            const resData = responseSuccess(
                data,
                "Ghi nhận dữ liệu cảm biến thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getLogs: async (req, res, next) => {
        try {
            const data = await telemetryService.getAssetTelemetry(
                req.params.assetId,
                req.query,
            );
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    setThreshold: async (req, res, next) => {
        try {
            const data = await telemetryService.setAssetThreshold(
                req.params.assetId,
                req.body,
            );
            const resData = responseSuccess(
                data,
                "Cấu hình ngưỡng cảnh báo thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getAlerts: async (req, res, next) => {
        try {
            const data = await telemetryService.getAlerts(req.query);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    updateAlert: async (req, res, next) => {
        try {
            const data = await telemetryService.updateAlertStatus(
                req.params.id,
                req.body.status,
                req.user.id,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật trạng thái cảnh báo thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default telemetryController;
