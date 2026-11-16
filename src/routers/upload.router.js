import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { responseSuccess } from "../common/helpers/response.helper.js";
import { AppError } from "../common/helpers/error.helper.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

const uploadRouter = express.Router();

uploadRouter.post("/", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) throw new AppError("Vui lòng chọn file tải lên", 400);

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "risova-cmms",
            resource_type: "auto",
        });

        const resData = responseSuccess(
            { url: result.secure_url, publicId: result.public_id },
            "Tải file lên thành công",
            201,
        );
        res.status(resData.statusCode).json(resData);
    } catch (error) {
        next(error);
    }
});

export default uploadRouter;
