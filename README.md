# Game Asset GIF Previewer

Website hiển thị, kiểm tra và xem trước hoạt ảnh GIF cho tài nguyên game (vòng ánh sáng, đeo lưng, v.v.).

## Tính năng:
- **Phân loại danh mục**: Lọc theo từng loại (Vòng ánh sáng, Đeo lưng, Tất cả...). Tự động nhận diện thư mục mới.
- **Thanh trượt kích thước**: Kéo phóng to / thu nhỏ kích thước thẻ ảnh trực tiếp.
- **Chế độ xem**:
  - Xem dạng lưới (Grid view)
  - Xem dạng thanh trượt trình chiếu (Carousel / Slider view)
- **Kiểm tra tương phản & độ trong suốt (Alpha)**:
  - Nền tối Studio
  - Nền đen tuyền (Pitch black)
  - Nền caro trong suốt (Checkerboard transparency)
  - Nền sáng (White)
- **Lightbox / Phóng to chi tiết**: Xem độ phân giải thực, dung lượng, sao chép link, tải file.
- **Tìm kiếm tức thì**: Lọc nhanh theo tên GIF.

## Cách thêm GIF mới:
1. Thêm ảnh GIF vào thư mục tương ứng (ví dụ: `vòng ánh sáng`, `đeo lưng` hoặc tạo thư mục mới).
2. Nhấp đúp vào file `update_and_push.bat` (hoặc chạy lệnh `powershell -File scan_gifs.ps1` rồi push lên Git).
3. Mở `index.html` hoặc xem trực tiếp trên GitHub Pages!