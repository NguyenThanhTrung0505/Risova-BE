import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import rootRouter from "./src/routers/root.router.js";
import cors from "cors";
import "dotenv/config";
import errorHandler from "./src/common/helpers/error.helper.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(
    cors({
        origin: process.env.API_FE,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    }),
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    message: {
        status: "error",
        statusCode: 429,
        message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    },
});
app.use(limiter);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", rootRouter);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Risova CMMS Server running on port ${port}`);
});
