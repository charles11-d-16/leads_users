const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");

router.get("/", inquiryController.getInquiries);
router.post("/bulk", inquiryController.bulkImportInquiries);
router.post("/:id/status", inquiryController.updateInquiryStatus);
router.put("/:id", inquiryController.updateInquiry);

module.exports = router;
