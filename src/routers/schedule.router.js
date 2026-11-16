import express from "express";
import { z } from "zod";
import scheduleController from "../controllers/schedule.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const scheduleRouter = express.Router();

const createScheduleSchema = z.object({
    body: z.object({
        assetId: z.number().int().positive(),
        title: z.string().min(3).max(150),
        scheduleType: z.enum(["TIME_BASED", "METER_BASED", "HYBRID"]),
        assignedSpecialtyId: z.number().int().positive().optional(),
        frequencyDays: z.number().int().positive().optional(),
        nextDueDate: z.string().optional(),
        generateLeadDays: z.number().int().nonnegative().default(7),
        meterInterval: z.number().positive().optional(),
        generateLeadMeter: z.number().nonnegative().optional(),
        estimatedDurationHours: z.number().positive().default(2),
        parts: z
            .array(
                z.object({
                    partId: z.number().int().positive(),
                    quantity: z.number().positive(),
                }),
            )
            .optional(),
    }),
});

scheduleRouter.get("/", scheduleController.getAll);
scheduleRouter.post(
    "/",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(createScheduleSchema),
    scheduleController.create,
);
scheduleRouter.post(
    "/trigger-due",
    authorizeRoles("ADMIN", "MANAGER"),
    scheduleController.triggerGenerate,
);

export default scheduleRouter;
