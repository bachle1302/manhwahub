import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';

interface ImageSelectorProps {
  show: boolean;
  onHide: () => void;
  onSelect: (imageUrl: string) => void;
}

export default function ImageSelector({ show, onHide, onSelect }: ImageSelectorProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchImages();
    }
  }, [show]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3005/api/uploads/list");
      setUploadedImages(response.data.images);
    } catch (error) {
      console.error("Error fetching images:", error);
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chọn ảnh</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px',
          justifyContent: 'flex-start',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {uploadedImages.map((img, index) => (
            <div key={index} style={{ cursor: 'pointer' }} onClick={() => onSelect(img)}>
              <img 
                src={`http://localhost:3005${img}`}
                style={{
                  height: '200px',
                  width: '200px',
                  objectFit: 'cover',
                  border: '2px solid #ddd',
                  borderRadius: '8px'
                }}
                alt={`Ảnh ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
} 