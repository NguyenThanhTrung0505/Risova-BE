import express from "express";
import { z } from "zod";
import assetController from "../controllers/asset.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const assetRouter = express.Router();

const assetDetailsSchema = z.object({
    manufacturer: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    serialNumber: z.string().max(100).optional(),
    description: z.string().optional(),
    purchaseDate: z.string().optional(),
    purchasePrice: z.number().nonnegative().optional(),
    imageUrl: z.string().url().optional(),
    documentUrl: z.string().url().optional(),
});

const createAssetSchema = z.object({
    body: z.object({
        assetCode: z.string().min(2).max(50),
        name: z.string().min(2).max(150),
        locationId: z.number().int().positive(),
        parentAssetId: z.number().int().positive().nullable().optional(),
        priority: z
            .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
            .default("MEDIUM"),
        requiredSpecialtyId: z.number().int().positive(),
        status: z
            .enum(["ACTIVE", "MAINTENANCE", "BROKEN", "RETIRED"])
            .default("ACTIVE"),
        currentMeter: z.number().nonnegative().optional(),
        meterUnit: z.string().max(20).optional(),
        installedDate: z.string().optional(),
        warrantyExpiry: z.string().optional(),
        details: assetDetailsSchema.optional(),
    }),
});

const updateAssetSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: createAssetSchema.shape.body.partial(),
});

assetRouter.get("/", assetController.getAll);
assetRouter.get("/:id", assetController.getOne);
assetRouter.post(
    "/",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(createAssetSchema),
    assetController.create,
);
assetRouter.patch(
    "/:id",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(updateAssetSchema),
    assetController.update,
);

export default assetRouter;
