import { responseSuccess } from "../common/helpers/response.helper.js";
import locationService from "../services/location.service.js";

const locationController = {
    getTree: async (req, res, next) => {
        try {
            const data = await locationService.getTree();
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getList: async (req, res, next) => {
        try {
            const data = await locationService.getFlatList();
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    create: async (req, res, next) => {
        try {
            const data = await locationService.createLocation(req.body);
            const resData = responseSuccess(data, "Tạo vị trí thành công", 201);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const data = await locationService.updateLocation(
                req.params.id,
                req.body,
            );
            const resData = responseSuccess(data, "Cập nhật vị trí thành công");
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default locationController;
