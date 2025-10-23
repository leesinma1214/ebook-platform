import { isAuth } from "@/middlewares/auth";
import { Router } from "express";
import { generateAuthLink, verifyAuthToken, sendProfileInfo } from "@/controllers/auth";
import { EmailValidationSchema, validate } from "@/middlewares/validator";

const authRouter = Router();

authRouter.post(
  "/generate-link",
  validate(EmailValidationSchema),
  generateAuthLink
);
authRouter.get("/verify", verifyAuthToken);
authRouter.get("/profile", isAuth, sendProfileInfo);

export default authRouter;
