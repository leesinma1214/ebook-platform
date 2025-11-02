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

const app = express();
/* 
app.use((req, res, next) => {
  req.on("data", (chunk) => {
    req.body = JSON.parse(chunk);
    next();
  });

  //console.log(req.body);
}); */

app.use(cors({ 
  origin: [process.env.APP_URL!], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use("/webhook", webhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/author", authorRouter);
app.use("/book", bookRouter);
app.use("/review", reviewRouter);
app.use("/history", historyRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);

app.get("/test", asyncHandler(async (req, res) => {
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
}));

app.use(errorHandler);

const port = process.env.PORT || 8989;

app.listen(port, () => {
  console.log(`The application is running on port http://localhost:${port}`);
});
