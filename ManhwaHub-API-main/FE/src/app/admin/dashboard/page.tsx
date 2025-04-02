"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
  
    console.log("Token:", token);
    console.log("Role:", role);
  
    if (!token) {
      console.log("Không tìm thấy token");
      router.replace("/auth/login");
    } else {
      const roleNum = parseInt(role || "0");
      if (roleNum !== 1 && roleNum !== 2) {
        console.log("Không có quyền admin");
        router.replace("/auth/login");
      } else {
        setIsAdmin(true);
      }
    }
  }, []);
  

  if (!isAdmin) {
    return <div className="text-center mt-5">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white vh-100 p-3" style={{ width: "250px" }}>
        <h4 className="text-center">Admin Panel</h4>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/stories">📚 Quản lý Truyện</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/chapters">📄 Quản lý Chương</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/comments">💬 Quản lý Bình luận</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/users">👤 Quản lý Người dùng</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white active" href="/admin/transactions">💰 Quản lý Giao dịch</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/upload">✍️ Upload ảnh</Link>
          </li>
        </ul>
      </div>
      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h2>Chào mừng đến với Admin Dashboard</h2>
        <p>Chọn một mục từ menu bên trái để quản lý.</p>
      </div>
    </div>
  );
}
