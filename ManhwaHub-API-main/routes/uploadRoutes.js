const express = require("express");
const { upload, uploadImage, getUploadedImages } = require("../controllers/uploadController");

const router = express.Router();

// API upload ảnh
router.post("/", upload.single("image"), uploadImage);

// API lấy danh sách ảnh
router.get("/list", getUploadedImages);

module.exports = router;
