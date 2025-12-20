import { Router } from "express";
import {
  generateAuthLink,
  logout,
  sendProfileInfo,
  updateProfile,
  verifyAuthToken,
  exchangeToken,
} from "@/controllers/auth";
import { isAuth } from "@/middlewares/auth";
import { fileParser } from "@/middlewares/file";
import {
  emailValidationSchema,
  newUserSchema,
  validate,
} from "@/middlewares/validator";

const authRouter = Router();

authRouter.post(
  "/generate-link",
  validate(emailValidationSchema),
  generateAuthLink
);
authRouter.get("/verify", verifyAuthToken);
authRouter.get("/profile", isAuth, sendProfileInfo);
authRouter.post("/logout", isAuth, logout);
authRouter.put(
  "/profile",
  isAuth,
  fileParser,
  validate(newUserSchema),
  updateProfile
);
authRouter.post("/exchange-token", exchangeToken); // Add this route

export default authRouter;
