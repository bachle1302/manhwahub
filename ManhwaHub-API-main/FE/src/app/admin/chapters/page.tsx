"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useState, useEffect } from "react";
import ImageSelector from '@/components/ImageSelector';
import { Button } from "react-bootstrap";

interface ChapterListItem {
  id: number;
  name: string;
  slug: string;
}

interface Story {
  id: number;
  name: string;
}

interface Chapter {
  id: number;
  slug: string;
  name: string;
  price: number;
  updated_at: string;
}

interface NewChapter {
  comic_id: string;
  name: string;
  chapter_number: number;
  content: string;
  slug: string;
  price: number;
  title: string;
}

interface StoriesResponse {
  comicsRecent: Story[];
}

interface ChaptersResponse {
  status: string;
  data: Chapter[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const token = Cookies.get("token");
  const role = Cookies.get("role");
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedStory, setSelectedStory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [editChapter, setEditChapter] = useState<NewChapter>({
    comic_id: "",
    name: "",
    chapter_number: 1,
    content: "",
    slug: "",
    price: 0,
    title: ""
  });
  const [newChapter, setNewChapter] = useState<NewChapter>({
    comic_id: "",
    name: "",
    chapter_number: 1,
    content: "",
    slug: "",
    price: 0,
    title: ""
  });
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'content' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    if (!token) {
      router.push("/auth/login");
      return false;
    }
    const roleNum = parseInt(role || "0");
    if (roleNum !== 1 && roleNum !== 2) {
      router.push("/auth/login");
      return false;
    }
    return true;
  };
  
  useEffect(() => {
    if (!checkAuth()) return;
    
    const fetchStories = async () => {
      try {
        let allStories: Story[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const res = await axios.get<StoriesResponse>(
            `http://localhost:9999/api/home/user?page=${currentPage}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          const storiesData = res.data.comicsRecent || [];
          if (storiesData.length === 0) {
            hasMore = false;
            break;
          }
          
          allStories = [...allStories, ...storiesData];
          currentPage++;
        }

        setStories(allStories);
        setFilteredStories(allStories);
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách truyện:", err);
        if (err.response?.status === 401) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          Cookies.remove("token");
          Cookies.remove("role");
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
          return;
        }
        setError("Lỗi khi tải danh sách truyện");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [token, role, router]);

  useEffect(() => {
    if (!selectedStory || !checkAuth()) return;
    
    fetchChapters();
  }, [selectedStory]);

  const fetchChapters = async () => {
    if (!selectedStory) return;
    if (!checkAuth()) return;
    
    try {
      setLoading(true);
      const res = await axios.get<ChaptersResponse>(
        `http://localhost:9999/api/chapters/list/${selectedStory}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log("Dữ liệu chương nhận được:", res.data);

      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        setChapters(res.data.data);
      } else {
        console.error("Dữ liệu không đúng định dạng:", res.data);
        setChapters([]);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách chương:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      setError("Lỗi khi tải danh sách chương");
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkAuth()) return;
    
    try {
      setLoading(true);
      
      // Chuyển đổi nội dung thành mảng
      let contentArray: string[] = [];
      // Xử lý như chuỗi phân tách bằng dấu phẩy
      contentArray = newChapter.content.split(',').map(url => url.trim()).filter(url => url.length > 0);

      const response = await axios.post(
        "http://localhost:9999/api/chapters", 
        {
          name: newChapter.name,
          chapter_number: newChapter.chapter_number.toString(), 
          content: contentArray,
          comic_id: newChapter.comic_id,
          slug: newChapter.slug,
          price: newChapter.price.toString(),
          title: newChapter.title
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        setSuccess("Thêm chương mới thành công!");
        setShowAddModal(false);
        // Reset form
        setNewChapter({
          comic_id: selectedStory,
          name: "",
          chapter_number: chapters.length + 1,
          content: "[]",
          slug: "",
          price: 0,
          title: ""
        });
        
        // Refresh danh sách chương
        if (selectedStory) {
          fetchChapters();
        }
      } else {
        setError("Không thể thêm chương: " + response.data.message);
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm chương mới:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        handleSessionExpired();
        return;
      }
      setError("Lỗi khi thêm chương mới: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Tự động cập nhật slug khi name thay đổi
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewChapter({
      ...newChapter,
      name,
      slug: name.toLowerCase()
                .replace(/đ/g, 'd')
                .replace(/[áàảãạâấầẩẫậăắằẳẵặ]/g, 'a')
                .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
                .replace(/[íìỉĩị]/g, 'i')
                .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
                .replace(/[úùủũụưứừửữự]/g, 'u')
                .replace(/[ýỳỷỹỵ]/g, 'y')
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '')
    });
  };

  const openAddModal = () => {
    setNewChapter({
      ...newChapter,
      comic_id: selectedStory,
      chapter_number: chapters.length + 1
    });
    setShowAddModal(true);
  };

  // Xem chi tiết chương
  const handleViewChapter = async (id: number) => {
    if (!checkAuth()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:9999/api/chapters/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        console.log("Chi tiết chương:", response.data.data);
        setCurrentChapter(response.data.data);
        setShowViewModal(true);
      } else {
        setError("Không thể tải thông tin chương");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin chương:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        handleSessionExpired();
        return;
      }
      setError("Lỗi khi tải thông tin chương: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Mở modal chỉnh sửa với dữ liệu chương hiện tại
  const handleOpenEditModal = async (id: number) => {
    if (!checkAuth()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:9999/api/chapters/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        const chapterData = response.data.data;
        setEditChapter({
          comic_id: selectedStory,
          name: chapterData.name || "",
          chapter_number: parseInt(chapterData.chapter_number || "1"),
          content: chapterData.content || "",
          slug: chapterData.slug || "",
          price: parseFloat(chapterData.price || "0"),
          title: chapterData.title || ""
        });
        setCurrentChapter(chapterData);
        setShowEditModal(true);
      } else {
        setError("Không thể tải thông tin chương");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin chương:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        handleSessionExpired();
        return;
      }
      setError("Lỗi khi tải thông tin chương: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật chương
  const handleEditChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth() || !currentChapter) return;
    
    try {
      setLoading(true);
      
      // Chuyển đổi nội dung thành mảng
      let contentArray: string[] = [];
      // Xử lý như chuỗi phân tách bằng dấu phẩy
      contentArray = editChapter.content.split(',').map(url => url.trim()).filter(url => url.length > 0);

      const response = await axios.put(
        `http://localhost:9999/api/chapters/${currentChapter.id}`,
        {
          name: editChapter.name,
          chapter_number: editChapter.chapter_number.toString(),
          content: contentArray,
          comic_id: editChapter.comic_id,
          slug: editChapter.slug,
          price: editChapter.price.toString(),
          title: editChapter.title
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        setSuccess("Cập nhật chương thành công!");
        setShowEditModal(false);
        setCurrentChapter(null);
        // Refresh danh sách chương
        if (selectedStory) {
          fetchChapters();
        }
      } else {
        setError("Không thể cập nhật chương: " + response.data.message);
      }
    } catch (err: any) {
      console.error("Lỗi khi cập nhật chương:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        handleSessionExpired();
        return;
      }
      setError("Lỗi khi cập nhật chương: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Mở modal xác nhận xóa
  const handleOpenDeleteModal = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setShowDeleteModal(true);
  };

  // Xóa chương
  const handleDeleteChapter = async () => {
    if (!checkAuth() || !currentChapter) return;
    
    try {
      setLoading(true);
      
      const response = await axios.delete(
        `http://localhost:9999/api/chapters/${currentChapter.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        setSuccess("Xóa chương thành công!");
        setShowDeleteModal(false);
        setCurrentChapter(null);
        // Refresh danh sách chương
        if (selectedStory) {
          fetchChapters();
        }
      } else {
        setError("Không thể xóa chương: " + response.data.message);
      }
    } catch (err: any) {
      console.error("Lỗi khi xóa chương:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        handleSessionExpired();
        return;
      }
      setError("Lỗi khi xóa chương: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Tự động cập nhật slug khi name thay đổi cho edit
  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setEditChapter({
      ...editChapter,
      name,
      slug: name.toLowerCase()
                .replace(/đ/g, 'd')
                .replace(/[áàảãạâấầẩẫậăắằẳẵặ]/g, 'a')
                .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
                .replace(/[íìỉĩị]/g, 'i')
                .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
                .replace(/[úùủũụưứừửữự]/g, 'u')
                .replace(/[ýỳỷỹỵ]/g, 'y')
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '')
    });
  };

  // Xử lý khi phiên đăng nhập hết hạn
  const handleSessionExpired = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  };

  // Thêm hàm xử lý tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    const filtered = stories.filter(story => 
      story.name.toLowerCase().includes(query)
    );
    setFilteredStories(filtered);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (currentImageField === 'content') {
      try {
        let currentContent = '';
        
        if (showEditModal) {
          // Đang trong chế độ sửa
          currentContent = editChapter.content;
          
          // Thêm URL ảnh mới vào chuỗi hiện tại
          if (currentContent && currentContent.trim() !== '') {
            // Nếu đã có nội dung, thêm dấu phẩy và URL mới
            setEditChapter(prev => ({
              ...prev,
              content: prev.content + ', ' + imageUrl
            }));
          } else {
            // Nếu chưa có nội dung, chỉ thêm URL mới
            setEditChapter(prev => ({
              ...prev,
              content: imageUrl
            }));
          }
        } else {
          // Đang trong chế độ thêm mới
          currentContent = newChapter.content;
          
          // Thêm URL ảnh mới vào chuỗi hiện tại
          if (currentContent && currentContent.trim() !== '') {
            // Nếu đã có nội dung, thêm dấu phẩy và URL mới
            setNewChapter(prev => ({
              ...prev,
              content: prev.content + ', ' + imageUrl
            }));
          } else {
            // Nếu chưa có nội dung, chỉ thêm URL mới
            setNewChapter(prev => ({
              ...prev,
              content: imageUrl
            }));
          }
        }
      } catch (error) {
        console.error('Lỗi khi xử lý ảnh:', error);
      }
    }
    setShowImageSelector(false);
    setCurrentImageField(null);
  };

  // Thêm hàm xử lý khi thay đổi nội dung thủ công
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>, isEdit: boolean = false) => {
    const content = e.target.value;
    
    // Lưu trữ giá trị nguyên bản, không cố gắng parse JSON trong quá trình nhập liệu
    if (isEdit) {
      setEditChapter(prev => ({ ...prev, content }));
    } else {
      setNewChapter(prev => ({ ...prev, content }));
    }
  };

  const openImageSelector = (field: 'content') => {
    setCurrentImageField(field);
    setShowImageSelector(true);
  };

  if (error) return <div className="text-center mt-5">{error}</div>;
  if (loading) return <div className="text-center mt-5">Đang tải dữ liệu...</div>;

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
        <h2>📄 Quản lý Chương</h2>

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
          </div>
        )}

        <div className="d-flex mb-3 align-items-center">
          <div className="me-3" style={{ width: "300px" }}>
            <label className="form-label">Chọn truyện:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm truyện..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <select 
                className="form-select" 
                onChange={(e) => setSelectedStory(e.target.value)}
                value={selectedStory}
              >
                <option value="">Chọn truyện</option>
                {filteredStories.map((story) => (
                  <option key={story.id} value={story.id}>{story.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            className="btn btn-primary ms-2 mt-4"
            onClick={openAddModal}
            disabled={!selectedStory}
          >
            + Thêm Chương Mới
          </button>
        </div>
        
        {chapters.length > 0 ? (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Tên Chương</th>
                <th>Slug</th>
                <th>Giá</th>
                <th>Ngày cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={chapter.id}>
                  <td>{index + 1}</td>
                  <td>{chapter.id}</td>
                  <td>{chapter.name}</td>
                  <td>{chapter.slug}</td>
                  <td>{chapter.price}</td>
                  <td>{new Date(chapter.updated_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-info btn-sm me-1" 
                      onClick={() => handleViewChapter(chapter.id)}
                    >
                      Xem
                    </button>
                    <button 
                      className="btn btn-warning btn-sm me-1" 
                      onClick={() => handleOpenEditModal(chapter.id)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleOpenDeleteModal(chapter)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="alert alert-info">Không có chương nào cho truyện này</div>
        )}

        {/* Modal thêm chương mới */}
        {showAddModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Thêm Chương Mới</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAddChapter}>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">ID Truyện</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newChapter.comic_id}
                          onChange={(e) => setNewChapter({...newChapter, comic_id: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Số chương</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newChapter.chapter_number}
                          onChange={(e) => setNewChapter({...newChapter, chapter_number: parseInt(e.target.value)})}
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Tên chương</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newChapter.name}
                          onChange={handleNameChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Tiêu đề</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newChapter.title}
                          onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                          required
                          placeholder="Nhập tiêu đề chương"
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newChapter.slug}
                          onChange={(e) => setNewChapter({...newChapter, slug: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Giá</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newChapter.price}
                          onChange={(e) => setNewChapter({...newChapter, price: parseFloat(e.target.value)})}
                          required
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nội dung (URL ảnh, phân tách bằng dấu phẩy)</label>
                      <div className="d-flex gap-2">
                        <textarea
                          className="form-control"
                          value={newChapter.content}
                          onChange={(e) => handleContentChange(e)}
                          rows={10}
                          placeholder="Nhập URL ảnh, phân tách bằng dấu phẩy. Ví dụ: https://example.com/image1.jpg, https://example.com/image2.jpg"
                          required
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={() => openImageSelector('content')}
                          style={{ height: 'fit-content' }}
                        >
                          Chọn ảnh
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowAddModal(false)}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Đang xử lý...' : 'Thêm chương'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal xem chi tiết chương */}
        {showViewModal && currentChapter && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xem Chi Tiết Chương</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowViewModal(false);
                      setCurrentChapter(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {currentChapter.comics && (
                    <div className="mb-4 p-3 border rounded bg-light">
                      <h5>Thông tin truyện:</h5>
                      <p><strong>Tên truyện:</strong> {currentChapter.comics.name}</p>
                      <p><strong>ID truyện:</strong> {currentChapter.comics.id}</p>
                      <p><strong>Slug truyện:</strong> {currentChapter.comics.slug}</p>
                    </div>
                  )}
                  
                  {currentChapter.currentChapter && (
                    <>
                      <h4>{currentChapter.currentChapter.name}</h4>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <p><strong>ID:</strong> {currentChapter.currentChapter.id}</p>
                          <p><strong>Slug:</strong> {currentChapter.currentChapter.slug}</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Giá:</strong> {currentChapter.currentChapter.price}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h5>Thứ tự chương:</h5>
                        <div className="d-flex gap-2">
                          {currentChapter.prevChapter && (
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleViewChapter(currentChapter.prevChapter.id)}
                            >
                              ← Chương trước: {currentChapter.prevChapter.name}
                            </button>
                          )}
                          
                          {currentChapter.nextChapter && (
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleViewChapter(currentChapter.nextChapter.id)}
                            >
                              Chương sau: {currentChapter.nextChapter.name} →
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {currentChapter.listChapter && currentChapter.listChapter.length > 0 && (
                        <div className="mb-3">
                          <h5>Danh sách chương:</h5>
                          <select 
                            className="form-select" 
                            onChange={(e) => handleViewChapter(parseInt(e.target.value))}
                            value={currentChapter.currentChapter.id}
                          >
                            {currentChapter.listChapter.map((chapter: ChapterListItem) => (
                              <option key={chapter.id} value={chapter.id}>
                                Chương {chapter.id}: {chapter.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <h5>Nội dung:</h5>
                        {(() => {
                          try {
                            // Thử lấy nội dung từ currentChapter.currentChapter.content
                            let contentStr = currentChapter.currentChapter.content;
                            // Kiểm tra nếu nội dung là chuỗi JSON
                            const images = JSON.parse(contentStr);
                            
                            return (
                              <div className="d-flex flex-column gap-2">
                                {Array.isArray(images) && images.map((url, idx) => (
                                  <div key={idx} className="text-center border p-2">
                                    <p className="mb-1 text-muted">Ảnh {idx + 1}</p>
                                    <img 
                                      src={url.startsWith('http') ? url : `http://localhost:9999${url}`}
                                      alt={`Ảnh ${idx + 1}`} 
                                      style={{ maxWidth: "100%" }} 
                                      className="img-fluid"
                                    />
                                    <p className="mt-1 text-break small">
                                      
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            // Nếu không parse được, hiển thị dưới dạng văn bản
                            const content = currentChapter.currentChapter.content || "";
                            return (
                              <div className="alert alert-info">
                                <p>{content}</p>
                                <p className="text-muted small mt-2">Lưu ý: Không thể hiển thị nội dung dưới dạng ảnh.</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  {currentChapter.currentChapter && (
                    <button 
                      type="button" 
                      className="btn btn-warning me-2" 
                      onClick={() => {
                        handleOpenEditModal(currentChapter.currentChapter.id);
                        setShowViewModal(false);
                      }}
                    >
                      Sửa chương này
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowViewModal(false);
                      setCurrentChapter(null);
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal sửa chương */}
        {showEditModal && currentChapter && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Sửa Chương</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentChapter(null);
                    }}
                  ></button>
                </div>
                <form onSubmit={handleEditChapter}>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">ID Truyện</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editChapter.comic_id}
                          onChange={(e) => setEditChapter({...editChapter, comic_id: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Số chương</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editChapter.chapter_number}
                          onChange={(e) => setEditChapter({...editChapter, chapter_number: parseInt(e.target.value)})}
                          required
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Tên chương</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editChapter.name}
                          onChange={handleEditNameChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Tiêu đề</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editChapter.title}
                          onChange={(e) => setEditChapter({...editChapter, title: e.target.value})}
                          required
                          placeholder="Nhập tiêu đề chương"
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editChapter.slug}
                          onChange={(e) => setEditChapter({...editChapter, slug: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Giá</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editChapter.price}
                          onChange={(e) => setEditChapter({...editChapter, price: parseFloat(e.target.value)})}
                          required
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nội dung (URL ảnh, phân tách bằng dấu phẩy)</label>
                      <div className="d-flex gap-2">
                        <textarea
                          className="form-control"
                          value={editChapter.content}
                          onChange={(e) => handleContentChange(e, true)}
                          rows={10}
                          required
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={() => openImageSelector('content')}
                          style={{ height: 'fit-content' }}
                        >
                          Chọn ảnh
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowEditModal(false);
                        setCurrentChapter(null);
                      }}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal xác nhận xóa */}
        {showDeleteModal && currentChapter && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCurrentChapter(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Bạn có chắc chắn muốn xóa chương <strong>{currentChapter.name}</strong>?</p>
                  <p className="text-danger">Hành động này không thể hoàn tác!</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCurrentChapter(null);
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteChapter}
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ImageSelector
        show={showImageSelector}
        onHide={() => setShowImageSelector(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}