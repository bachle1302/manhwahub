"use client";

import { useEffect, useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import Link from "next/link";
import { Modal, Button, Form } from "react-bootstrap";

interface User {
  id: number;
  name: string;
  email: string;
  exp: number;
  avatar: string | null;
  total_point: number;
}

interface ApiResponse {
  users: User[];
}

function AdminUsers(): ReactElement {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("token");
      const role = Cookies.get("role");
      if (!token || parseInt(role || "0") !== 2) {
        router.push("/auth/login");
      } else {
        setIsAdmin(true);
        fetchUsers();
      }
    };
    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token");
      const response = await axios.get<ApiResponse>("http://localhost:3005/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (error) {
      setError("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`http://localhost:3005/api/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      setError("Không thể xóa người dùng");
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      const token = Cookies.get("token");
      await axios.put(`http://localhost:3005/api/user`, selectedUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      setError("Không thể cập nhật người dùng");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Quản lý Người dùng</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>EXP</th>
              <th>Avatar</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.exp}</td>
                <td>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} width="40" height="40" className="rounded-circle" />
                  ) : (
                    "Không có ảnh"
                  )}
                </td>
                <td>
                  <button className="btn btn-info btn-sm me-2" onClick={() => handleView(user)}>Xem</button>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(user)}>Sửa</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedUser && (
        <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>{isEdit ? "Sửa Người Dùng" : "Thông Tin Người Dùng"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isEdit ? (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tên</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={selectedUser.email} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>EXP</Form.Label>
                  <Form.Control
                    type="number"
                    value={selectedUser.exp}
                    onChange={(e) => setSelectedUser({ ...selectedUser, exp: parseInt(e.target.value) })}
                  />
                </Form.Group>
              </Form>
            ) : (
              <div>
                <p><strong>ID:</strong> {selectedUser.id}</p>
                <p><strong>Tên:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>EXP:</strong> {selectedUser.exp}</p>
                <p><strong>avatar:</strong> {selectedUser.avatar}</p>
                <p><strong>só dư tài khoản:</strong> {selectedUser.total_point}</p>
                <p><strong>EXP:</strong> {selectedUser.exp}</p>

              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {isEdit && <Button variant="primary" onClick={handleSave}>Lưu</Button>}
            <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default AdminUsers;