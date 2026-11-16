import express from "express";
import authRouter from "./auth.router.js";
import userRouter from "./user.router.js";
import locationRouter from "./location.router.js";
import assetRouter from "./asset.router.js";
import workOrderRouter from "./workOrder.router.js";
import inventoryRouter from "./inventory.router.js";
import telemetryRouter from "./telemetry.router.js";
import scheduleRouter from "./schedule.router.js";
import dashboardRouter from "./dashboard.router.js";
import uploadRouter from "./upload.router.js";
import verifyToken from "../common/helpers/verify.helper.js";

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);

rootRouter.use(verifyToken);
rootRouter.use("/users", userRouter);
rootRouter.use("/locations", locationRouter);
rootRouter.use("/assets", assetRouter);
rootRouter.use("/work-orders", workOrderRouter);
rootRouter.use("/inventory", inventoryRouter);
rootRouter.use("/telemetry", telemetryRouter);
rootRouter.use("/schedules", scheduleRouter);
rootRouter.use("/dashboard", dashboardRouter);
rootRouter.use("/upload", uploadRouter);

export default rootRouter;
