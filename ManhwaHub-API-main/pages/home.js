document.addEventListener("DOMContentLoaded", async function () {
    const truyenHot = document.getElementById("truyen-hot");
    const truyenList = document.getElementById("truyen-list");

    async function loadTruyen() {
        try {
            const response = await fetch("http://localhost:3005/api/home");
            const result = await response.json();

            console.log("Dữ liệu API:", result);

            if (result.status === "success") {
                truyenHot.innerHTML = "";
                truyenList.innerHTML = "";

                result.data.forEach(truyen => {
                    const colDiv = document.createElement("div");
                    colDiv.className = "col-md-2 mb-3 position-relative";

                    colDiv.innerHTML = `
                        <div class="card shadow-sm">
                            <img src="${truyen.thumbnail}" class="card-img-top" alt="${truyen.name}">
                            <div class="card-body text-center">
                                <h6 class="card-title">${truyen.name}</h6>
                                <p class="text-warning">Chương ${truyen.chapter}</p>
                                <a href="chapters.html?id=${truyen.id}" class="btn btn-sm btn-outline-light">Xem Chi Tiết</a>
                            </div>
                        </div>
                    `;

                    if (truyen.hot) {
                        const hotBadge = document.createElement("span");
                        hotBadge.className = "badge";
                        hotBadge.textContent = "Hot";
                        colDiv.appendChild(hotBadge);
                        truyenHot.appendChild(colDiv);
                    } else {
                        truyenList.appendChild(colDiv);
                    }
                });
            } else {
                truyenHot.innerHTML = "<p class='text-danger'>Không thể tải danh sách truyện hot.</p>";
                truyenList.innerHTML = "<p class='text-danger'>Không thể tải danh sách truyện.</p>";
            }
        } catch (error) {
            truyenHot.innerHTML = "<p class='text-danger'>Lỗi khi tải dữ liệu.</p>";
            truyenList.innerHTML = "<p class='text-danger'>Lỗi khi tải dữ liệu.</p>";
            console.error("Lỗi API:", error);
        }
    }

    loadTruyen();
});
