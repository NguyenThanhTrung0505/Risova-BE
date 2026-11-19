import express from "express";
import { z } from "zod";
import assetController from "../controllers/asset.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";
import { PRIORITIES, ASSET_STATUSES } from "../common/constants/enums.js";

const assetRouter = express.Router();

const assetDetailSchema = z.object({
    manufacturer: z.string().trim().max(100).nullish(),
    model: z.string().trim().max(100).nullish(),
    serialNumber: z
        .string()
        .trim()
        .max(100)
        .nullish()
        .transform((v) => v || null),
    description: z.string().trim().max(2000).nullish(),
    purchaseDate: z.string().date().nullish(),
    purchasePrice: z.coerce.number().min(0).nullish(),
    imageUrl: z.string().trim().max(255).nullish(),
    documentUrl: z.string().trim().max(255).nullish(),
});

const assetSchema = z.object({
    assetCode: z.string().trim().min(1).max(50),
    name: z.string().min(2).max(150),
    locationId: z.coerce.number().int().positive(),
    parentAssetId: z.coerce.number().int().positive().nullish(), // được undefined
    priority: z.enum(PRIORITIES),
    requiredSpecialtyId: z.coerce.number().int().positive(),
    status: z.enum(ASSET_STATUSES),
    currentMeter: z.coerce.number().min(0),
    meterUnit: z.string().trim().min(1).max(20),
    qrCodeUrl: z.string().trim().max(255),
    installedDate: z.string().date().nullish(),
    warrantyExpiry: z.string().date().nullish(),

    details: assetDetailSchema.nullish(),
});

const createAssetSchema = z.object({
    body: assetSchema.extend({
        assetCode: assetSchema.shape.assetCode.optional(),
        priority: assetSchema.shape.priority.default("MEDIUM"),
        status: assetSchema.shape.status.default("ACTIVE"),
        currentMeter: assetSchema.shape.currentMeter.default(0),
        meterUnit: assetSchema.shape.meterUnit.default("HOURS"),
        qrCodeUrl: assetSchema.shape.qrCodeUrl.optional(),
    }),
});

const updateAssetSchema = z.object({
    //cho cha và con đều được un
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: assetSchema
        .omit({
            assetCode: true,
        })
        .partial()
        .extend({
            details: assetDetailSchema.partial().optional(),
        }),
});

const thresholdsSchema = z.object({
    body: z
        .array(
            z.object({
                metricType: z.string().trim().min(1).max(50),
                unit: z.string().trim().min(1).max(20),
                warningLimit: z.coerce.number(),
                dangerLimit: z.coerce.number(),
            }),
        )
        .max(20),
});

const bomSchema = z.object({
    body: z
        .array(
            z.object({
                partId: z.coerce.number().int(),
                standardQuantity: z.coerce.number().positive().default(1),
            }),
        )
        .max(200),
});

// GET | asset
assetRouter.get("/", assetController.getAll);
assetRouter.get("/:id", assetController.getOne);

// POST | asset
assetRouter.post(
    "/",
    authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"),
    validate(createAssetSchema),
    assetController.create,
);

// PUT | asset
assetRouter.put(
    "/:id",
    authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"),
    validate(updateAssetSchema),
    assetController.update,
);

// thresholds
assetRouter.get("/:id/thresholds", assetController.getThresholds);
assetRouter.put(
    "/:id/thresholds",
    authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"),
    validate(thresholdsSchema),
    assetController.setThresholds,
);

// bom
assetRouter.get("/:id/bom", assetController.getBom);
assetRouter.put(
    "/:id/bom",
    // authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"),
    validate(bomSchema),
    assetController.setBom,
);
export default assetRouter;
