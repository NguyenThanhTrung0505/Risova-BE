import { responseSuccess } from "../common/helpers/response.helper.js";
import inventoryService from "../services/inventory.service.js";

const inventoryController = {
    getParts: async (req, res, next) => {
        try {
            const data = await inventoryService.getParts(req.query);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    createPart: async (req, res, next) => {
        try {
            const data = await inventoryService.createPart(req.body);
            const resData = responseSuccess(
                data,
                "Thêm vật tư thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    recordMovement: async (req, res, next) => {
        try {
            const data = await inventoryService.recordStockMovement(
                req.body,
                req.user.id,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật giao dịch kho thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    issuePart: async (req, res, next) => {
        try {
            const data = await inventoryService.issueWorkOrderPart(
                req.params.woPartId,
                req.body,
                req.user.id,
            );
            const resData = responseSuccess(
                data,
                "Duyệt xuất vật tư thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    returnPart: async (req, res, next) => {
        try {
            const data = await inventoryService.returnWorkOrderPart(
                req.params.woPartId,
                req.body,
                req.user.id,
            );
            const resData = responseSuccess(
                data,
                "Quyết toán / hoàn trả vật tư thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getTransactions: async (req, res, next) => {
        try {
            const data = await inventoryService.getTransactions(req.query);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default inventoryController;
