import "@/db/connect";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import errorHandler from "./middlewares/errorHandler";
import { fileParser } from "./middlewares/file";

const app = express();
/* 
app.use((req, res, next) => {
  req.on("data", (chunk) => {
    req.body = JSON.parse(chunk);
    next();
  });

  //console.log(req.body);
}); */

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.post("/test", fileParser, (req, res) => {
  console.log(req.files);
  console.log(req.body);
  res.json({});
});

app.use(errorHandler);

const port = process.env.PORT || 8989;

app.listen(port, () => {
  console.log(`The application is running on port http://localhost:${port}`);
});
