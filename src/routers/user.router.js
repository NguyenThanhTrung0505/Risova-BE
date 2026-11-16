import express from "express";
import { z } from "zod";
import userController from "../controllers/user.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const userRouter = express.Router();

const updateUserSchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({
        isActive: z.boolean().optional(),
        isAvailable: z.boolean().optional(),
        role: z
            .enum([
                "ADMIN",
                "MANAGER",
                "TECHNICIAN",
                "STAFF",
                "INVENTORY_STAFF",
            ])
            .optional(),
    }),
});

const specialtySchema = z.object({
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: z.object({
        specialtyId: z.number().int().positive(),
        skillLevel: z.number().int().min(1).max(5).default(1),
    }),
});

const shiftSchema = z.object({
    body: z.object({
        userId: z.number().int().positive(),
        shiftId: z.number().int().positive(),
        workDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng YYYY-MM-DD"),
    }),
});

const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    }),
});

// Lấy thông tin bản thân & Master data (specialties, shifts, failure codes)
userRouter.get("/me", userController.getMe);
userRouter.patch(
    "/me/password",
    validate(changePasswordSchema),
    userController.changePassword,
);
userRouter.get("/master-data", userController.getMasterData);

// Quản lý danh sách nhân sự & phân ca
userRouter.get(
    "/",
    authorizeRoles("ADMIN", "MANAGER"),
    userController.getUsers,
);
userRouter.patch(
    "/:id",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(updateUserSchema),
    userController.updateUser,
);
userRouter.post(
    "/:id/specialties",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(specialtySchema),
    userController.assignSpecialty,
);
userRouter.post(
    "/shifts",
    authorizeRoles("ADMIN", "MANAGER"),
    validate(shiftSchema),
    userController.assignShift,
);

export default userRouter;
