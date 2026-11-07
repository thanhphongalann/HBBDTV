# Thiệp sinh nhật online

## Chạy trên máy của bạn

Mở Terminal tại thư mục dự án và chạy:

```bash
npm run dev
```

Sau đó mở `http://localhost:3000`.

## Cá nhân hóa thiệp

Mở [`app/card-config.ts`](app/card-config.ts) và sửa:

- `recipient`: tên người nhận.
- `birthdayMonth` và `birthdayDay`: tháng và ngày sinh nhật.
- `thoughts` và `letter`: các câu tâm sự và nội dung lá thư.
- `photos`: đường dẫn đến ảnh trong thư mục `public`.
- `musicSrc`: đường dẫn đến nhạc nền trong thư mục `public`.

Ví dụ: chép ảnh vào `public/anh/ky-niem-1.jpg`, rồi thêm `"/anh/ky-niem-1.jpg"` vào `photos`. Chép nhạc vào `public/nhac-sinh-nhat.mp3`, rồi đặt `musicSrc` thành `"/nhac-sinh-nhat.mp3"`.

Lời chúc cho công việc, tình yêu, sức khỏe và tinh thần cũng nằm trong `app/card-config.ts`, ở mảng `wishes`.


Hiện Trang mẫu đã có hãy truy cập https://happybirthdayalann.vercel.app/ để xem :3