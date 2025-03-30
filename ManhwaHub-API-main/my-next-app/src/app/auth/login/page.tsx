"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("http://localhost:3005/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        Cookies.set("token", data.jwt_token, { expires: 7 });
        Cookies.set("role", data.user.role.toString(), { expires: 7 });
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối đến server");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <form onSubmit={handleLogin} className="bg-white p-4 rounded shadow w-25">
        <h2 className="mb-3 text-center">Đăng nhập Admin</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Đăng nhập</button>
        <p className="text-center mt-3">
          Chưa có tài khoản? 
          <button type="button" className="btn btn-link p-0" onClick={() => router.push("/auth/register")}>Đăng ký</button>
        </p>
      </form>
    </div>
  );
}