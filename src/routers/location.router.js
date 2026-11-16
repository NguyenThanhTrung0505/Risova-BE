import express from "express";
import { z } from "zod";
import locationController from "../controllers/location.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const locationRouter = express.Router();

const createLocationSchema = z.object({
    body: z.object({
        code: z.string().min(2).max(30),
        name: z.string().min(2).max(100),
        locationType: z.enum(["PLANT", "ZONE", "LINE"]),
        parentId: z.number().int().positive().nullable().optional(),
        description: z.string().optional(),
    }),
});

const updateLocationSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        locationType: z.enum(["PLANT", "ZONE", "LINE"]).optional(),
        parentId: z.number().int().positive().nullable().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});

locationRouter.get("/tree", locationController.getTree);
locationRouter.get("/", locationController.getList);
locationRouter.post(
    "/",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(createLocationSchema),
    locationController.create,
);
locationRouter.patch(
    "/:id",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(updateLocationSchema),
    locationController.update,
);

export default locationRouter;
