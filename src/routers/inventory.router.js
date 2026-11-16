import express from "express";
import { z } from "zod";
import inventoryController from "../controllers/inventory.controller.js";
import { authorizeRoles } from "../common/middlewares/authorize.middleware.js";
import { validate } from "../common/middlewares/validate.middleware.js";

const inventoryRouter = express.Router();

const createPartSchema = z.object({
    body: z.object({
        partCode: z.string().min(2).max(50),
        name: z.string().min(2).max(150),
        unit: z.string().min(1).max(20),
        quantityInStock: z.number().nonnegative().default(0),
        minStockLevel: z.number().nonnegative().default(5),
        unitPrice: z.number().nonnegative().default(0),
    }),
});

const movementSchema = z.object({
    body: z.object({
        partId: z.number().int().positive(),
        transactionType: z.enum(["RECEIPT", "ADJUSTMENT"]),
        quantity: z.number().refine((val) => val !== 0, "Số lượng phải khác 0"),
        supplierName: z.string().optional(),
    }),
});

inventoryRouter.get("/parts", inventoryController.getParts);
inventoryRouter.post(
    "/parts",
    authorizeRoles("ADMIN", "MANAGER", "INVENTORY_STAFF"),
    validate(createPartSchema),
    inventoryController.createPart,
);
inventoryRouter.get("/transactions", inventoryController.getTransactions);
inventoryRouter.post(
    "/transactions",
    authorizeRoles("ADMIN", "INVENTORY_STAFF"),
    validate(movementSchema),
    inventoryController.recordMovement,
);
inventoryRouter.patch(
    "/wo-parts/:woPartId/issue",
    authorizeRoles("ADMIN", "INVENTORY_STAFF"),
    inventoryController.issuePart,
);
inventoryRouter.patch(
    "/wo-parts/:woPartId/return",
    authorizeRoles("ADMIN", "INVENTORY_STAFF", "TECHNICIAN"),
    inventoryController.returnPart,
);

export default inventoryRouter;
