"use client";

import { useState } from "react";
import { Container, Row, Col, Card, Button, Spinner, Form } from "react-bootstrap";
import axios from "axios";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn một file ảnh!");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:3005/api/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedImages([...uploadedImages, response.data.url]);
      setSelectedFile(null);
      alert("Upload thành công!");
    } catch (error) {
      alert("Upload thất bại!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await axios.get("http://localhost:3005/api/uploads/list");
      setUploadedImages(response.data.images);
    } catch (error) {
      console.error("Không thể tải danh sách ảnh", error);
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">📸 Quản lý Ảnh</h2>

      <Row className="justify-content-center">
        <Col md={6}>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Chọn ảnh để tải lên</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
          </Form.Group>

          <Button variant="primary" onClick={handleUpload} disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" /> : "📤 Upload"}
          </Button>

          <Button variant="success" className="ms-2" onClick={fetchImages}>
            🔄 Tải danh sách ảnh
          </Button>
        </Col>
      </Row>

      <h4 className="mt-4">🖼️ Ảnh đã upload</h4>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px',
        justifyContent: 'flex-start'
      }}>
        {uploadedImages.map((img, index) => (
          <div key={index}>
            <Card>
              <Card.Img 
                variant="top" 
                src={`http://localhost:3005${img}`}
                style={{
                  height: '400px',
                  width: '400px',
                  objectFit: 'cover'
                }}
              />
            </Card>
          </div>
        ))}
      </div>
    </Container>
  );
}
