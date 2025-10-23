import { Router } from "express";
import { isAuth } from "@/middlewares/auth";
import { logout } from "@/controllers/auth";
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
authRouter.post("/logout", isAuth, logout);

export default authRouter;
