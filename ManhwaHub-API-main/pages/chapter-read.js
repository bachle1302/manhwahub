document.addEventListener("DOMContentLoaded", async function () {
    const chapterTitle = document.getElementById("chapter-title");
    const chapterContent = document.getElementById("chapter-content");
    const prevBtn = document.getElementById("prev-chapter");
    const nextBtn = document.getElementById("next-chapter");

    // Lấy ID chapter từ URL
    const urlParams = new URLSearchParams(window.location.search);
    let chapterId = parseInt(urlParams.get("id")) || 1;

    async function loadChapter() {
        try {
            const response = await fetch(`http://localhost:3005/api/chapters/${chapterId}`);
            const result = await response.json();

            console.log("Dữ liệu API:", result);

            if (result.status === "success") {
                chapterTitle.textContent = result.data.name;

                let images = result.data.content;
                if (typeof images === "string") {
                    images = JSON.parse(images);
                }

                // Xóa nội dung cũ trước khi cập nhật nội dung mới
                chapterContent.innerHTML = "";

                images.forEach(imgUrl => {
                    const colDiv = document.createElement("div");
                    colDiv.className = "col-md-6 text-center";

                    const imgElement = document.createElement("img");
                    imgElement.src = imgUrl;
                    imgElement.alt = result.data.name;
                    imgElement.className = "img-fluid rounded shadow";

                    colDiv.appendChild(imgElement);
                    chapterContent.appendChild(colDiv);
                });
            } else {
                chapterTitle.textContent = "Không thể tải chương!";
            }
        } catch (error) {
            chapterTitle.textContent = "Lỗi khi tải dữ liệu!";
            console.error("Lỗi API:", error);
        }
    }

    // Xử lý sự kiện khi bấm nút chương trước
    prevBtn.addEventListener("click", function () {
        if (chapterId > 1) {
            window.location.href = `chapter-read.html?id=${chapterId - 1}`;
        }
    });

    // Xử lý sự kiện khi bấm nút chương sau
    nextBtn.addEventListener("click", function () {
        window.location.href = `chapter-read.html?id=${chapterId + 1}`;
    });

    // Load chương đầu tiên khi vào trang
    loadChapter();
});
