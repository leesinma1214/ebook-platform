import HistoryModel from "@/models/history";
import asyncHandler from "@/utils/asyncHandler";

export const updateBookHistory = asyncHandler(async (req, res) => {
  const { bookId, highlights, lastLocation } = req.body;

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
    if (highlights?.length) history.highlights.push(...highlights);
  }

  await history.save();

  res.json({ message: "History updated successfully" });
});