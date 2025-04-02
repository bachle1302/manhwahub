"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { ReactElement } from 'react';
import Link from "next/link";

interface User {
  id: number;
  email: string;
  name: string;
  exp?: number;
  avatar?: string | null;
  total_point?: number;
}

interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TransactionsResponse {
  status?: string;
  data?: Transaction[];
  meta?: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
  };
}

function AdminTransactionsContent(): ReactElement {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
    
    if (!token) {
      // Only redirect to login if no token exists
      router.push("/auth/login");
    } else {
      const roleNum = parseInt(role || "0");
      if (roleNum !== 2) {
        // If user is logged in but not an admin, set error state instead of redirecting
        setError("Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể xem giao dịch.");
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        fetchUsers();
      }
    }
  }, [router]);

  useEffect(() => {
    console.log("Current users state:", users);
    console.log("Filtered users:", filteredUsers);
  }, [users, filteredUsers]);

  const fetchUsers = async () => {
    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập trang này.");
        return;
      }
      
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get("http://localhost:9999/api/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("API Response:", response.data);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else if (response.data.users && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        console.error("Cấu trúc dữ liệu không đúng định dạng:", response.data);
        setError("Dữ liệu người dùng không đúng định dạng");
      }
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError("Không thể tải danh sách người dùng");
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get(`http://localhost:9999/api/user/${selectedUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUser(response.data.user);
      console.log("API Response:", response.data);
    } catch (error: any) {
      console.error("Lỗi khi tải thông tin người dùng:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError("Không thể tải thông tin người dùng");
    }
  };

  const fetchTransactions = async () => {
    if (!selectedUserId) return;

    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      
      setIsLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get<Transaction[]>(
        `http://localhost:9999/api/transactions/user/${selectedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // API trả về mảng trực tiếp, không có cấu trúc meta
      const allTransactions = response.data;
      setAllTransactions(allTransactions);
      setTotalTransactions(allTransactions.length);
      
      // Không có phân trang từ API, nên tự xử lý phân trang ở client
      const itemsPerPage = 10;
      const calculatedTotalPages = Math.ceil(allTransactions.length / itemsPerPage);
      setTotalPages(calculatedTotalPages);
      
      // Phân trang sẽ được xử lý trong useEffect khi currentPage thay đổi
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách giao dịch:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      // Nếu lỗi 404, có nghĩa là không có giao dịch, hiển thị danh sách rỗng
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setAllTransactions([]);
        setTransactions([]);
        setTotalTransactions(0);
        setTotalPages(1);
      } else {
        setError("Không thể tải danh sách giao dịch");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      // Check admin permission first
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      
      fetchTransactions();
      fetchUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      const itemsPerPage = 10;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      console.log(`Phân trang: trang ${currentPage}, hiển thị ${startIndex+1}-${Math.min(endIndex, allTransactions.length)} trên ${allTransactions.length} giao dịch`);
      setTransactions(allTransactions.slice(startIndex, endIndex));
    }
  }, [currentPage, allTransactions]);

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'failed':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  };

  if (!isAdmin) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="text-center p-5 bg-light rounded shadow" style={{ maxWidth: '600px' }}>
          <h2 className="text-danger mb-4">🔒 Quyền truy cập bị từ chối</h2>
          <p className="lead mb-4">{error || "Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể xem giao dịch."}</p>
          <div className="d-flex justify-content-center gap-3">
            <button 
              className="btn btn-primary" 
              onClick={() => router.push("/admin/dashboard")}
            >
              Về trang chủ
            </button>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => {
                Cookies.remove("token");
                Cookies.remove("role");
                router.push("/auth/login");
              }}
            >
              Đăng nhập với tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
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
        <h2 className="mb-4">Quản lý Giao dịch</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm email hoặc tên người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={fetchUsers}
              >
                🔄 Làm mới
              </button>
            </div>
            <div className="mb-2">
              <small className="text-muted">Đã tải: {users.length} người dùng</small>
            </div>
            <select
              className="form-select"
              value={selectedUserId || ""}
              onChange={(e) => {
                setError(null);
                setSelectedUserId(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="">Chọn người dùng</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email} - {user.name}
                </option>
              ))}
            </select>   
          </div>
        </div>
            <p>Số dư tài khoản: {selectedUser?.total_point}</p>  
        {isLoading ? (
          <div className="text-center">Đang tải...</div>
        ) : selectedUserId ? (
          <>
            <div className="mb-3">
              Tổng số giao dịch: {totalTransactions}
            </div>
            
            {transactions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Số tiền</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                      <th>Mô tả</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.amount.toLocaleString('vi-VN')}đ</td>
                        <td>{transaction.type}</td>
                        <td className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </td>
                        <td>{transaction.description}</td>
                        <td>{new Date(transaction.created_at).toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">Người dùng này chưa có giao dịch nào</div>
            )}
            
            {totalPages > 1 && (
              <nav className="mt-4">
                <ul className="pagination justify-content-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </>
        ) : (
          <div className="text-center">Vui lòng chọn một người dùng để xem giao dịch</div>
        )}
      </div>
    </div>
  );
}

export default AdminTransactionsContent; 