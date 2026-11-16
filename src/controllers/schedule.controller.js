import { responseSuccess } from "../common/helpers/response.helper.js";
import scheduleService from "../services/schedule.service.js";

const scheduleController = {
    getAll: async (req, res, next) => {
        try {
            const data = await scheduleService.getAllSchedules();
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    create: async (req, res, next) => {
        try {
            const data = await scheduleService.createSchedule(req.body);
            const resData = responseSuccess(
                data,
                "Tạo lịch bảo dưỡng thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    triggerGenerate: async (req, res, next) => {
        try {
            const data = await scheduleService.triggerDueSchedules(req.user);
            const resData = responseSuccess(
                data,
                `Đã quét ${data.scannedCount} lịch và sinh ${data.generatedCount} phiếu bảo dưỡng`,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default scheduleController;
