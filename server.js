import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import rootRouter from "./src/routers/root.router.js";
import cors from "cors";
import dotenv from "dotenv";
import errorHandler from "./src/common/helpers/error.helper.js";

const app = express();
const port = process.env.PORT;

app.use(
    cors({
        origin: process.env.API_FE,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    }),
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
});
app.use(limiter);

app.use(morgan("dev"));

app.use(express.json());

app.use("/api", rootRouter);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
