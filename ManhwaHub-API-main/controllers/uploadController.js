const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Cấu hình nơi lưu file ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Thư mục lưu ảnh
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên file
  },
});

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File không hợp lệ! Chỉ chấp nhận .png, .jpg, .jpeg, .gif"), false);
  }
};

const upload = multer({ storage, fileFilter });

// API Upload ảnh
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file nào được tải lên" });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
};

// API Lấy danh sách ảnh đã tải lên
const getUploadedImages = (req, res) => {
  const uploadDir = "uploads";

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: "Không thể đọc thư mục ảnh" });
    }

    // Lọc chỉ lấy file ảnh
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    res.json({ images: imageFiles.map(file => `/uploads/${file}`) });
  });
};

// Xuất các API
module.exports = { upload, uploadImage, getUploadedImages };
