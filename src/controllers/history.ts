import HistoryModel from "@/models/history";
import asyncHandler from "@/utils/asyncHandler";
import { sendErrorResponse } from "@/utils/helper";
import { isValidObjectId } from "mongoose";

interface Highlight {
  selection: string;
  fill: string;
}

export const updateBookHistory = asyncHandler(async (req, res) => {
  const { bookId, highlights, lastLocation, remove } = req.body;

  let history = await HistoryModel.findOne({
    book: bookId,
    reader: req.user.id,
  });

  if (!history) {
    history = new HistoryModel({
      reader: req.user.id,
      book: bookId,
      lastLocation,
      highlights,
    });
  } else {
    if (lastLocation) history.lastLocation = lastLocation;
    // storing highlights
    if (highlights?.length && !remove) history.highlights.push(...highlights);

    // removing highlights
    if (highlights?.length && remove) {
      //   history.highlights = history.highlights.filter((item) => {
      //     const highlight = highlights.find((h) => {
      //       if (h.selection === item.selection) {
      //         return h;
      //       }
      //     });
      //     if (!highlight) return true;
      //   });
      history.highlights = history.highlights.filter(
        (item) => !highlights.find((h: Highlight) => h.selection === item.selection)
      );
    }
  }

  await history.save();

  res.json({ message: "History updated successfully" });
});

export const getBookHistory = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  if (!isValidObjectId(bookId))
    return sendErrorResponse({
      res,
      message: "Invalid book id!",
      status: 422,
    });

  const history = await HistoryModel.findOne({
    book: bookId,
    reader: req.user.id,
  });
  if (!history)
    return sendErrorResponse({
      res,
      message: "Not Found!",
      status: 404,
    });

  res.json({
    history: {
      lastLocation: history.lastLocation,
      highlights: history.highlights.map((h) => ({
        fill: h.fill,
        selection: h.selection,
      })),
    },
  });
});