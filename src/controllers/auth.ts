import { Request, Response, RequestHandler } from "express";
import crypto from "crypto";

export const generateAuthLink: RequestHandler = (req, res) => {
  // Generate authentication link
  // And send that link to the users email address

  console.log(req.body);

  res.json({ ok: true });
};
