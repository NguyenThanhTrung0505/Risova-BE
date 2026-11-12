import express from "express";
import authRouter from "./auth.router.js";
import verifyToken from "../common/helpers/verify.helper.js";

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);

export default rootRouter;
