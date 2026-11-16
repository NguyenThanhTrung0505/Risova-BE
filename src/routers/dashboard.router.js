import express from "express";
import dashboardController from "../controllers/dashboard.controller.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/overview", dashboardController.getOverview);
dashboardRouter.get("/notifications", dashboardController.getNotifications);
dashboardRouter.patch(
    "/notifications/:id/read",
    dashboardController.markNotificationRead,
);

export default dashboardRouter;
