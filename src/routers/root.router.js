import express from "express";
import authRouter from "./auth.router.js";
import userRouter from "./user.router.js";
import metaRouter from "./meta.router.js";
import locationRouter from "./location.router.js";
import assetRouter from "./asset.router.js";
import inventoryRouter from "./inventory.router.js";
import workOrderRouter from "./workOrder.router.js";
import scheduleRouter from "./schedule.router.js";
import iotRouter, { iotDeviceRouter } from "./iot.router.js";
import dashboardRouter from "./dashboard.router.js";
import reportRouter from "./report.router.js";
import auditRouter from "./audit.router.js";
import notificationRouter from "./notification.router.js";
import uploadRouter from "./upload.router.js";
import verifyToken from "../common/helpers/verify.helper.js";

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/device", iotDeviceRouter); // thiết bị IoT gửi số đo bằng x-api-key

rootRouter.use(verifyToken);
rootRouter.use("/", dashboardRouter); // /dashboard, /summary, /search
rootRouter.use("/users", userRouter);
rootRouter.use("/meta", metaRouter);
rootRouter.use("/locations", locationRouter);
rootRouter.use("/assets", assetRouter);
rootRouter.use("/inventory", inventoryRouter);
rootRouter.use("/work-orders", workOrderRouter);
rootRouter.use("/schedules", scheduleRouter);
rootRouter.use("/iot", iotRouter);
rootRouter.use("/reports", reportRouter);
rootRouter.use("/audit-logs", auditRouter);
rootRouter.use("/notifications", notificationRouter);
rootRouter.use("/uploads", uploadRouter);

export default rootRouter;
