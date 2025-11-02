import { sendErrorResponse } from "@/utils/helper";
import asyncHandler from "@/utils/asyncHandler";

export const handlePayment = asyncHandler(async (req, res) => {
    const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return sendErrorResponse({
      res,
      message: "Could not complete payment!",
      status: 400,
    });
  }
});