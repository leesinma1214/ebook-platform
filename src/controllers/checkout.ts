import { BookDoc } from "@/models/book";
import CartModel from "@/models/cart";
import { sendErrorResponse } from "@/utils/helper";
import asyncHandler from "@/utils/asyncHandler";
import { isValidObjectId } from "mongoose";

export const checkout = asyncHandler(async (req, res) => {
    const { cartId } = req.body;
  if (!isValidObjectId(cartId)) {
    return sendErrorResponse({ res, message: "Invalid cart id!", status: 401 });
  }

  const cart = await CartModel.findById(cartId).populate<{
    items: { product: BookDoc; quantity: number };
  }>({
    path: "items.product",
  });

  if (!cart) {
    return sendErrorResponse({ res, message: "Cart not found!", status: 404 });
  }

  // if the cart is valid and there are products inside the cart then send those information to stripe and generate the payment link.
});
  