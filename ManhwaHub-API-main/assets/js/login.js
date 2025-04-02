document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('http://localhost:3005/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, remember }),
        });

        const data = await response.json();

        if (response.ok) {
            // Lưu token và thông tin user
            localStorage.setItem('jwt_token', data.jwt_token);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_id', data.user.id);

            // Nếu chọn "Remember me", lưu remember_token
            if (remember && data.remember_token) {
                localStorage.setItem('remember_token', data.remember_token);
            }

            // Chuyển hướng dựa trên role
            if (data.user.role === 2) {
                window.location.href = '../pages/admin/dashboard.html';
            } else if (data.user.role === 1) {
                window.location.href = '../pages/author/dashboard.html';
            }
        } else {
            // Xử lý lỗi từ API
            if (response.status === 401) {
                errorMessage.textContent = 'Sai email hoặc mật khẩu!';
            } else if (response.status === 404) {
                errorMessage.textContent = 'Email không tồn tại!';
            } else {
                errorMessage.textContent = data.message || 'Đăng nhập thất bại!';
            }
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'Lỗi kết nối: ' + error.message;
        errorMessage.style.display = 'block';
    }
});