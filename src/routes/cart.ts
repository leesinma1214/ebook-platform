import { updateCart } from "@/controllers/cart";
import { isAuth } from "@/middlewares/auth";
import { cartItemsSchema, validate } from "@/middlewares/validator";
import { Router } from "express";

const cartRouter = Router();

cartRouter.put("/", isAuth, validate(cartItemsSchema), updateCart);

export default cartRouter;