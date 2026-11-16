import { responseSuccess } from "../common/helpers/response.helper.js";
import userService from "../services/user.service.js";

const userController = {
    getMe: async (req, res, next) => {
        try {
            const data = await userService.getProfile(req.user.id);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getUsers: async (req, res, next) => {
        try {
            const data = await userService.getUsers(req.query);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        try {
            const data = await userService.updateStatus(
                req.params.id,
                req.body,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật nhân sự thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    changePassword: async (req, res, next) => {
        try {
            await userService.changePassword(req.user.id, req.body);
            const resData = responseSuccess(null, "Đổi mật khẩu thành công");
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    assignSpecialty: async (req, res, next) => {
        try {
            const data = await userService.setTechnicianSpecialty(
                req.params.id,
                req.body,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật chuyên môn thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getMasterData: async (req, res, next) => {
        try {
            const data = await userService.getMasterData();
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    assignShift: async (req, res, next) => {
        try {
            const data = await userService.scheduleUserShift(req.body);
            const resData = responseSuccess(
                data,
                "Phân ca làm việc thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default userController;
