import type { Metadata } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond, Oooh_Baby } from "next/font/google";
import "./globals.css";

// ============================================================================
// CẤU HÌNH PHÔNG CHỮ TIẾNG VIỆT & KHUNG TRANG GỐC (layout.tsx)
// Tự động tải và nhúng nội bộ 3 phông chữ chuẩn dấu tiếng Việt:
// 1. Cormorant Garamond: Chữ có chân điện ảnh sang trọng cho tiêu đề & vòng số ngày.
// 2. Oooh Baby: Chữ viết tay bút mực tự nhiên cho tờ giấy tâm sự & chú thích Polaroid.
// 3. Be Vietnam Pro: Chữ không chân thanh thoát cho nút bấm & dòng dẫn.
// ============================================================================

const serifFont = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cinema-serif",
  display: "swap",
});

const handFont = Oooh_Baby({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--font-handwriting",
  display: "swap",
});

const sansFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500"],
  variable: "--font-ui-sans",
  display: "swap",
});

// Siêu dữ liệu hiển thị trên tab trình duyệt và khi gửi đường dẫn qua tin nhắn.
export const metadata: Metadata = {
  title: "Một Món Quà Sinh Nhật Dành Riêng Cho Cậu ✦",
  description:
    "Chạm nhẹ để mở tấm thiệp sinh nhật tương tác, thắp sáng ngọn nến ước nguyện và thả ngôi sao bay lên bầu trời đêm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${serifFont.variable} ${handFont.variable} ${sansFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
