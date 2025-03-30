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
  name: string;
  exp: number;
}

interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
  User: User;
  replies: Comment[];
}

interface Story {
  id: number;
  name: string;
}

interface CommentsResponse {
  status: string;
  data: Comment[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalComments: number;
  };
}

function AdminCommentsContent(): ReactElement {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
    
    if (!token) {
      router.push("/auth/login");
    } else {
      const roleNum = parseInt(role || "0");
      if (roleNum !== 1 && roleNum !== 2) {
        router.push("/auth/login");
      } else {
        setIsAdmin(true);
        fetchStories();
      }
    }
  }, [router]);

  const fetchStories = async () => {
    try {
      // Lấy tất cả truyện với limit lớn để đảm bảo lấy hết
      const response = await axios.get("http://localhost:3005/api/home?limit=1000");
      setStories(response.data.comicsRecent);
    } catch (error) {
      console.error("Lỗi khi tải danh sách truyện:", error);
      setError("Không thể tải danh sách truyện");
    }
  };

  const fetchComments = async () => {
    if (!selectedStoryId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get<CommentsResponse>(
        `http://localhost:3005/api/comics/${selectedStoryId}/comments?page=${currentPage}`
      );
      
      // Sắp xếp comments theo thứ tự phân cấp
      const sortedComments = sortCommentsByHierarchy(response.data.data);
      setComments(sortedComments);
      setTotalPages(response.data.meta.totalPages);
      setTotalComments(response.data.meta.totalComments);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bình luận:", error);
      setError("Không thể tải danh sách bình luận");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStoryId) {
      fetchComments();
    }
  }, [selectedStoryId, currentPage]);

  useEffect(() => {
    if (stories.length > 0) {
      const filtered = stories.filter(story =>
        story.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStories(filtered);
    }
  }, [searchTerm, stories]);

  const sortCommentsByHierarchy = (comments: Comment[]): Comment[] => {
    // Tạo map để lưu trữ comments theo id
    const commentMap = new Map<number, Comment>();
    
    // Lưu tất cả comments vào map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment });
    });
    
    // Tạo mảng kết quả chứa các comments gốc
    const rootComments: Comment[] = [];
    
    // Sắp xếp comments theo phân cấp
    comments.forEach(comment => {
      if (comment.parent_id === null) {
        // Comment gốc (cha)
        rootComments.push(commentMap.get(comment.id)!);
      } else {
        // Comment con
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(commentMap.get(comment.id)!);
        }
      }
    });
    
    return rootComments;
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

    try {
      const token = Cookies.get("token");
      await axios.delete(`http://localhost:3005/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess("Xóa bình luận thành công!");
      fetchComments();
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      setError("Không thể xóa bình luận");
    }
  };

  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment);
    setShowEditModal(true);
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment) return;

    try {
      const token = Cookies.get("token");
      if (!token) {
        setError("Bạn cần đăng nhập lại để thực hiện thao tác này");
        router.push("/auth/login");
        return;
      }

      await axios.put(
        `http://localhost:3005/api/comments/${editingComment.id}`,
        { content: editingComment.content },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess("Sửa bình luận thành công!");
      setShowEditModal(false);
      setEditingComment(null);
      fetchComments();
    } catch (error) {
      console.error("Lỗi khi sửa bình luận:", error);
      setError("Không thể sửa bình luận. Vui lòng thử lại.");
    }
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    return (
      <div key={comment.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="card mb-2">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="card-subtitle mb-2 text-muted">
                  {comment.User.name} (EXP: {comment.User.exp})
                </h6>
                <p className="card-text">{comment.content}</p>
                <small className="text-muted">
                  {new Date(comment.created_at).toLocaleString('vi-VN')}
                </small>
              </div>
              <div>
                <button
                  className="btn btn-primary btn-sm me-2"
                  onClick={() => handleEditClick(comment)}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="ms-3">
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
            <Link className="nav-link text-white active" href="/admin/comments">💬 Quản lý Bình luận</Link>
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
        <h2 className="mb-4">Quản lý Bình luận</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm tên truyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={selectedStoryId || ""}
              onChange={(e) => {
                setSelectedStoryId(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="">Chọn truyện</option>
              {filteredStories.map(story => (
                <option key={story.id} value={story.id}>
                  {story.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center">Đang tải...</div>
        ) : selectedStoryId ? (
          <>
            <div className="mb-3">
              Tổng số bình luận: {totalComments}
            </div>
            
            {comments.map(comment => renderComment(comment))}
            
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
          <div className="text-center">Vui lòng chọn một truyện để xem bình luận</div>
        )}

        {/* Modal Sửa Bình luận */}
        {showEditModal && editingComment && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Sửa Bình luận</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingComment(null);
                    }}
                  ></button>
                </div>
                <form onSubmit={handleEditComment}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Nội dung bình luận</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={editingComment.content}
                        onChange={(e) => setEditingComment({
                          ...editingComment,
                          content: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingComment(null);
                      }}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCommentsContent;    