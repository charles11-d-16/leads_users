const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");

router.get("/", inquiryController.getInquiries);
router.post("/:id/status", inquiryController.updateInquiryStatus);

module.exports = router;
