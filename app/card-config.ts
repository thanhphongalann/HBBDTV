// ============================================================================
// FILE CẤU HÌNH TRUNG TÂM CỦA THIỆP SINH NHẬT (card-config.ts)
// Bạn chỉ cần chỉnh sửa tên người nhận, tên người gửi, ngày tháng sinh nhật,
// nhạc nền, danh sách ảnh kỷ niệm và nội dung lời chúc tại đây.
// Mẹo nhỏ: Cũng có thể cá nhân hóa nhanh qua đường dẫn URL mà không cần sửa code,
// ví dụ: ?to=Lan&from=Minh&day=17&month=7
// ============================================================================

export const cardConfig = {
  // Tên người nhận thiệp (điền tên sau, mặc định để "Cậu" cho thân mật, tự nhiên).
  recipient: "Cậu",

  // Tên người gửi hiển thị ở phần ký tên cuối thiệp.
  sender: "Tớ",

  // Ngày sinh nhật (1–31) và tháng sinh nhật (1–12) để vòng số chạy dọc dừng lại đúng ngày.
  birthdayDay: 17,
  birthdayMonth: 7,

  // Đường dẫn đến file nhạc nền trong thư mục public (ví dụ: "/nhac-sinh-nhat.mp3").
  // Nếu để trống "", thiệp sẽ tự động ngân vang giai điệu Piano & Hộp nhạc ấm áp.
  musicSrc: "",

  // Các lớp ảnh chụp thật bằng máy ảnh DSLR phục vụ cảnh Bánh Kem & Thắp Nến 3 giây:
  // - cakeUnlitImage   : Bánh kem dâu tây kem tươi chụp phòng tối khi chưa thắp nến.
  // - cakeBodyLitImage : Thân bánh kem & nến sáp ong rực sáng ánh nến thật 2200K.
  // - cakeFlamesImage  : Ngọn lửa nến chụp thật tách lớp để lớn dần & lay động 60fps.
  cakeUnlitImage: "/media/cake-unlit.jpg",
  cakeBodyLitImage: "/media/cake-body-lit.jpg",
  cakeFlamesImage: "/media/cake-flames.jpg",

  // Các ảnh chụp thật từ máy ảnh cho phông nền bokeh ống kính 50mm f/1.4,
  // phong bì sáp thực tế, giấy viết tay sợi bông và bầu trời đêm dải Ngân Hà.
  cinemaBokehImage: "/media/cinema-bokeh.jpg",
  goldenOrbBokehImage: "/media/golden-orb-bokeh.jpg",
  waxEnvelopeImage: "/media/wax-envelope.webp",
  deskEnvelopesImage: "/media/desk-envelopes.jpg",
  cottonPaperImage: "/media/cotton-paper.webp",
  kraftPaperImage: "/media/kraft-paper.webp",
  nightSkyImage: "/media/night-sky.webp",
  deepGalaxyImage: "/media/galaxy-deep.webp",

  // Ảnh kỷ niệm nhỏ dạng Polaroid kẹp ở góc trên bên phải tờ giấy tâm sự.
  letterPolaroidPhoto: "/media/memory-1.jpg",

  // Danh sách ảnh kỷ niệm dùng để ghép thành hình trái tim 46 mảnh và xem phóng to trong album.
  // Khi muốn thay bằng ảnh thật của người nhận, bạn chép ảnh vào public/media rồi sửa đường dẫn bên dưới.
  photos: [
    "/media/memory-1.jpg",
    "/media/memory-2.webp",
    "/media/memory-3.webp",
    "/media/memory-4.webp",
    "/media/memory-5.webp",
    "/media/memory-6.webp",
  ] as string[],

  // Dòng chú thích kỷ niệm hiển thị dưới mỗi bức ảnh khi mở chế độ xem ảnh chi tiết.
  photoCaptions: [
    "Ánh pháo bông lấp lánh trong đêm như nụ cười rạng rỡ của cậu",
    "Một bó hoa dịu dàng thay lời chúc tuổi mới thật nhiều niềm vui",
    "Chút ngọt ngào bình yên cho một ngày thật đáng nhớ",
    "Những đốm sáng lung linh gom lại thành kỷ niệm đẹp",
    "Chiều hoàng hôn ấm áp khép lại những muộn phiền cũ",
    "Mỗi cánh hoa nhỏ là một điều lành gửi đến bên cậu",
  ],

  // Các câu tâm sự hiện lên từng câu một sau khi thắp nến xong:
  // Câu trước hiện rõ -> dừng lại để đọc -> mờ dần tan đi -> câu tiếp theo xuất hiện (tổng ~16 giây).
  thoughts: [
    "Hôm nay là ngày thế giới dịu dàng đón cậu đến với cuộc đời này…",
    "Cảm ơn cậu vì đã luôn kiên cường, ngay cả trong những ngày chẳng ngỏ lời cùng ai.",
    "Mong tuổi mới của cậu có thật nhiều bình yên, tiếng cười trong trẻo và những buổi chiều thảnh thơi.",
    "Trước khi bước vào tuổi mới, hãy chọn một phong thư nguyện ước dành riêng cho mình nhé.",
  ],

  // Nội dung trên tờ giấy thủ công: chữ sẽ hiện ra mượt mà như nét bút mực viết tay trong đúng 10 giây.
  letter: `Tớ không giỏi nói mấy lời hoa mỹ, nên viết đơn giản thôi: chúc mừng sinh nhật cậu nha.

Năm vừa rồi chắc chẳng dễ dàng gì, vậy mà cậu vẫn đi tới được hôm nay — giỏi hơn cậu nghĩ nhiều đấy.

Tớ chỉ mong cậu ăn ngon ngủ đủ, bớt lo một chút, và nhớ luôn dịu dàng với chính mình nhiều hơn nữa nhé.`,

  // Lời nhắn trang trọng trong khung viền vàng trước khi điều ước hóa thành ngôi sao.
  finalBlessing:
    "Mong điều ước cậu chọn — và cả lá thư nhỏ này — thật sự tìm được đường đến với cậu trong năm mới.",
};

// Bốn lá thư nguyện ước tương ứng 4 lĩnh vực: Công việc, Tình yêu, Sức khỏe, Tinh thần.
// Sử dụng sắc độ sáp niêm phong thực tế trên nền phong bì giấy cổ chụp thật.
export const wishes = [
  {
    id: "work",
    title: "Công việc",
    subtitle: "Vững vàng & tỏa sáng rực rỡ",
    sealLabel: "SỰ NGHIỆP",
    postmarkCode: "NO. 01 • CAREER",
    sealHueRotate: "18deg",
    warmSpotlight: "rgba(244, 192, 134, 0.24)",
    tiltDeg: -1.35,
    icon: "✦",
    message:
      "Chúc con đường công việc và những dự định của cậu ngày càng hanh thông. Mong mọi cố gắng âm thầm đều kết trái ngọt, để cậu luôn tự hào về hành trình mình đang bước đi.",
  },
  {
    id: "love",
    title: "Tình yêu",
    subtitle: "Luôn được trân trọng & vỗ về",
    sealLabel: "YÊU THƯƠNG",
    postmarkCode: "NO. 02 • AMOUR",
    sealHueRotate: "-8deg",
    warmSpotlight: "rgba(242, 166, 178, 0.24)",
    tiltDeg: 1.05,
    icon: "♡",
    message:
      "Chúc trái tim cậu luôn được nâng niu, được thấu hiểu và ở cạnh những người khiến cậu thấy an toàn nhất khi là chính mình. Hôm nay cậu xứng đáng nhận về thật nhiều thương mến.",
  },
  {
    id: "health",
    title: "Sức khỏe",
    subtitle: "Thân khỏe mạnh, giấc ngủ an lành",
    sealLabel: "BÌNH AN",
    postmarkCode: "NO. 03 • VITALITY",
    sealHueRotate: "42deg",
    warmSpotlight: "rgba(218, 204, 152, 0.22)",
    tiltDeg: -0.85,
    icon: "☼",
    message:
      "Chúc cậu một tuổi mới dồi dào sức khỏe, ăn ngon miệng, ngủ thật sâu và luôn tràn đầy sinh lực để tận hưởng trọn vẹn từng chuyến đi, từng niềm vui phía trước.",
  },
  {
    id: "spirit",
    title: "Tinh thần",
    subtitle: "Nhẹ nhõm & bình yên từ bên trong",
    sealLabel: "AN NHIÊN",
    postmarkCode: "NO. 04 • SERENITY",
    sealHueRotate: "-24deg",
    warmSpotlight: "rgba(214, 188, 232, 0.22)",
    tiltDeg: 1.25,
    icon: "☾",
    message:
      "Mong cậu luôn giữ được một khoảng trời dịu êm trong tâm hồn, biết gác lại âu lo khi mỏi mệt và mỉm cười thật tươi trước những điều nhỏ bé đáng yêu mỗi ngày.",
  },
] as const;

// Kiểu dữ liệu cho từng lá thư điều ước.
export type WishItem = (typeof wishes)[number];
