import express from "express";
import { z } from "zod";
import telemetryController from "../controllers/telemetry.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const telemetryRouter = express.Router();

const ingestSchema = z.object({
    body: z.object({
        assetId: z.number().int().positive(),
        metricType: z.string().min(1).max(50),
        unit: z.string().min(1).max(20),
        value: z.number(),
        source: z.enum(["IOT_SENSOR", "MANUAL"]).default("IOT_SENSOR"),
    }),
});

const thresholdSchema = z.object({
    params: z.object({ assetId: z.coerce.number().int().positive() }),
    body: z.object({
        metricType: z.string().min(1).max(50),
        unit: z.string().min(1).max(20),
        warningLimit: z.number(),
        dangerLimit: z.number(),
    }),
});

const alertStatusSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({
        status: z.enum(["ACKNOWLEDGED", "RESOLVED"]),
    }),
});

telemetryRouter.post(
    "/logs",
    validate(ingestSchema),
    telemetryController.ingest,
);
telemetryRouter.get("/assets/:assetId/logs", telemetryController.getLogs);
telemetryRouter.post(
    "/assets/:assetId/thresholds",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(thresholdSchema),
    telemetryController.setThreshold,
);
telemetryRouter.get("/alerts", telemetryController.getAlerts);
telemetryRouter.patch(
    "/alerts/:id",
    authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"),
    validate(alertStatusSchema),
    telemetryController.updateAlert,
);

export default telemetryRouter;
