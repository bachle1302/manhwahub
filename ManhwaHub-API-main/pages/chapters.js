document.addEventListener("DOMContentLoaded", async function () {
    const truyenTitle = document.getElementById("truyen-title");
    const chapterList = document.getElementById("chapter-list");

    // Lấy ID truyện từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const truyenId = urlParams.get("id");

    async function loadChapters() {
        try {
            const response = await fetch(`http://localhost:3005/api/home`);
            const result = await response.json();

            console.log("Dữ liệu API:", result);

            if (result.status === "success") {
                // Tìm truyện có ID tương ứng
                const truyen = result.data.find(t => t.id == truyenId);

                if (!truyen) {
                    truyenTitle.textContent = "Không tìm thấy truyện!";
                    return;
                }

                truyenTitle.textContent = truyen.name;
                chapterList.innerHTML = ""; // Xóa nội dung cũ (nếu có)

                truyen.Chapters.forEach(chapter => {
                    const li = document.createElement("li");
                    li.className = "list-group-item d-flex justify-content-between align-items-center";

                    li.innerHTML = `
                        <a href="chapter-read.html?id=${chapter.id}" class="text-decoration-none">
                            ${chapter.name}
                        </a>
                        <span class="badge bg-primary rounded-pill">Chương ${chapter.chapter_number}</span>
                    `;

                    chapterList.appendChild(li);
                });
            } else {
                truyenTitle.textContent = "Không thể tải danh sách chương.";
            }
        } catch (error) {
            truyenTitle.textContent = "Lỗi khi tải dữ liệu.";
            console.error("Lỗi API:", error);
        }
    }

    loadChapters();
});
