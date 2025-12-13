import "@/db/connect";
import asyncHandler from "./utils/asyncHandler";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import errorHandler from "./middlewares/errorHandler";
import authorRouter from "./routes/author";
import bookRouter from "./routes/book";
import reviewRouter from "./routes/review";
import ReviewModel from "./models/review";
import { Types } from "mongoose";
import historyRouter from "./routes/history";
import cartRouter from "./routes/cart";
import checkoutRouter from "./routes/checkout";
import webhookRouter from "./routes/webhook";
import orderRouter from "./routes/order";
import searchRouter from "./routes/search";
import morgan from "morgan";

const app = express();
app.set("trust proxy", 1); // Essential for Render to handle secure cookies correctly

app.use(morgan("dev"));

const normalizeOrigin = (v: string) => v.trim().replace(/\/$/, "");

const rawOrigins = (process.env.APP_URL ?? "").trim(); // expected: "https://www.digiread.store,https://<vercel>.vercel.app"
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map(normalizeOrigin).filter(Boolean)
  : [];

const isProd = process.env.NODE_ENV === "production";

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // Requests like top-level navigation, curl, or same-origin may have no Origin header.
    if (!origin) return cb(null, true);

    const o = normalizeOrigin(origin);

    if (allowedOrigins.includes(o)) return cb(null, true);

    // In production, fail closed so you notice misconfigured APP_URL immediately.
    if (isProd) return cb(new Error(`CORS blocked for origin: ${origin}`));

    // In non-prod, allow if APP_URL wasn't configured (avoids "it works locally only in dev mode" confusion).
    if (!allowedOrigins.length) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use("/webhook", express.raw({ type: "application/json" }), webhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.AUTH_SECRET)); // Must match the secret used to sign cookies

app.use("/auth", authRouter);
app.use("/author", authorRouter);
app.use("/book", bookRouter);
app.use("/review", reviewRouter);
app.use("/history", historyRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);
app.use("/order", orderRouter);
app.use("/search", searchRouter);

app.get(
  "/test",
  asyncHandler(async (req, res) => {
    const [result] = await ReviewModel.aggregate<{ averageRating: number }>([
      {
        $match: {
          book: new Types.ObjectId("6900df97092f80a9a720e398"),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    res.json({ review: result.averageRating.toFixed(1) });
  })
);

app.use(errorHandler);

const port = process.env.PORT || 8989;

app.listen(port, () => {
  console.log(`The application is running on port http://localhost:${port}`);
});
