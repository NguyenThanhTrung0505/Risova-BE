import express from "express";
import { z } from "zod";
import workOrderController from "../controllers/workOrder.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const workOrderRouter = express.Router();

const createWoSchema = z.object({
    body: z.object({
        assetId: z.number().int().positive(),
        title: z.string().min(3).max(200),
        description: z.string().optional(),
        woType: z.enum(["PREVENTIVE", "REPAIR", "EMERGENCY"]),
        priority: z
            .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
            .default("MEDIUM"),
        assignedTo: z.number().int().positive().nullable().optional(),
        autoAssign: z.boolean().default(true),
        scheduledStart: z.string().optional(),
        scheduledEnd: z.string().optional(),
        estimatedCost: z.number().nonnegative().optional(),
        checklists: z
            .array(
                z.object({
                    stepNumber: z.number().int().positive().optional(),
                    taskDescription: z.string().min(1).max(255),
                }),
            )
            .optional(),
        parts: z
            .array(
                z.object({
                    partId: z.number().int().positive(),
                    quantityNeeded: z.number().positive(),
                }),
            )
            .optional(),
    }),
});

const updateStatusSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({
        status: z.enum([
            "OPEN",
            "ASSIGNED",
            "IN_PROGRESS",
            "ON_HOLD",
            "COMPLETED",
            "CLOSED",
            "CANCELLED",
        ]),
        assignedTo: z.number().int().positive().optional(),
        holdReason: z.string().optional(),
        cancelReason: z.string().optional(),
        failureCodeId: z.number().int().positive().optional(),
        rootCause: z.string().optional(),
        resolutionNotes: z.string().optional(),
        laborHours: z.number().nonnegative().optional(),
    }),
});

const checklistSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive(),
        checklistId: z.coerce.number().int().positive(),
    }),
    body: z.object({
        isCompleted: z.boolean(),
        note: z.string().optional(),
        evidenceImageUrl: z.string().url().optional(),
    }),
});

workOrderRouter.get("/", workOrderController.getAll);
workOrderRouter.get("/:id", workOrderController.getOne);
workOrderRouter.post("/", validate(createWoSchema), workOrderController.create);
workOrderRouter.patch(
    "/:id/status",
    validate(updateStatusSchema),
    workOrderController.updateStatus,
);
workOrderRouter.patch(
    "/:id/checklists/:checklistId",
    authorizeRoles("ADMIN", "MANAGER", "TECHNICIAN"),
    validate(checklistSchema),
    workOrderController.updateChecklist,
);

export default workOrderRouter;
