import { responseSuccess } from "../common/helpers/response.helper.js";
import assetService from "../services/asset.service.js";

const assetController = {
    getAll: async (req, res, next) => {
        try {
            const data = await assetService.getAll(req.query);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    getOne: async (req, res, next) => {
        try {
            const data = await assetService.getAssetDetail(req.params.id);
            const resData = responseSuccess(data);
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    create: async (req, res, next) => {
        try {
            const data = await assetService.createAsset(req.body);
            const resData = responseSuccess(
                data,
                "Tạo thiết bị thành công",
                201,
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const data = await assetService.updateAsset(
                req.params.id,
                req.body,
            );
            const resData = responseSuccess(
                data,
                "Cập nhật thiết bị thành công",
            );
            res.status(resData.statusCode).json(resData);
        } catch (error) {
            next(error);
        }
    },
};

export default assetController;
