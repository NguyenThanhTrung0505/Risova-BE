import { responseSuccess } from "../common/helpers/response.helper.js";
import workOrderService from "../services/workOrder.service.js";

const workOrderController = {
    getAll: async (req, res, next) => {
        try {
            const data = await workOrderService.getWorkOrders(
                req.query,
                req.user,
            );
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getOne: async (req, res, next) => {
        try {
            const data = await workOrderService.getWorkOrderDetail(
                req.params.id,
            );
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    create: async (req, res, next) => {
        try {
            const data = await workOrderService.createWorkOrder(
                req.body,
                req.user,
            );
            const resData = responseSuccess(
                data,
                "Tạo phiếu công việc thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    updateStatus: async (req, res, next) => {
        try {
            const data = await workOrderService.updateStatus(
                req.params.id,
                req.body,
                req.user,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật trạng thái phiếu thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    updateChecklist: async (req, res, next) => {
        try {
            const data = await workOrderService.updateChecklistItem(
                req.params.id,
                req.params.checklistId,
                req.body,
                req.user,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật checklist thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default workOrderController;
