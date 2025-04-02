import React, { useEffect, useState } from "react";

const Comment = ({ comicId }) => {
    const [comments, setComments] = useState([]);
    const [username, setUsername] = useState("");
    const [content, setContent] = useState("");

    useEffect(() => {
        fetch(`http://localhost:3005/api/comics/${comicId}/comments`)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    setComments(data.data);
                }
            });
    }, [comicId]);

    const handleAddComment = async () => {
        if (!username || !content) return alert("Vui lòng nhập đầy đủ thông tin!");

        const response = await fetch(`http://localhost:3005/api/comics/${comicId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, content }),
        });

        const data = await response.json();
        if (data.status === "success") {
            setComments([...comments, { id: data.id, username, content, created_at: new Date().toISOString() }]);
            setUsername("");
            setContent("");
        } else {
            alert("Lỗi khi thêm bình luận!");
        }
    };

    return (
        <div className="container mt-4">
            <h3>Bình luận</h3>
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Tên của bạn"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <textarea
                    className="form-control"
                    placeholder="Viết bình luận..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                ></textarea>
            </div>
            <button className="btn btn-primary" onClick={handleAddComment}>Gửi</button>

            <ul className="list-group mt-3">
                {comments.map((comment) => (
                    <li key={comment.id} className="list-group-item">
                        <strong>{comment.username}:</strong> {comment.content} <small>({new Date(comment.created_at).toLocaleString()})</small>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Comment;
