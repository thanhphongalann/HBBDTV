// ============================================================================
// FILE CẤU HÌNH TRUNG TÂM CỦA THIỆP SINH NHẬT HOÀNG KIM — MỆNH KIM (card-config.ts)
// Bạn chỉ cần chỉnh sửa tên người nhận, tên người gửi, ngày tháng sinh nhật,
// nhạc nền, danh sách ảnh kỷ niệm và nội dung lời chúc tại đây.
// Toàn bộ bảng màu đã được tinh chỉnh sang Vàng Hoàng Kim 24K, Vàng Sâm Panh
// và Trắng Ngà Bạch Kim tương sinh rực rỡ cho người Mệnh Kim.
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
  // Nếu để trống "", thiệp sẽ tự động ngân vang giai điệu Piano & Hộp nhạc ấm áp ngay khi mở ấn sáp.
  musicSrc: "",

  // Các lớp ảnh chụp thật bằng máy ảnh DSLR cho Trang Mở Đầu phong cách Harry Potter / Ấn Sáp Vàng:
  // - hogwartsDeskImage     : Bàn gỗ thư pháp cổ với ngòi bút đồng, lò nung sáp vàng dưới ánh nến.
  // - waxEnvelopeImage      : Phong bì giấy da dê cổ chụp thật kèm con dấu sáp vàng hoàng kim 24K.
  // - candleFlameMacroImage : Ngọn nến sáp thật cháy lung linh trong bóng tối.
  hogwartsDeskImage: "/media/hogwarts-desk-gold.jpg",
  waxEnvelopeImage: "/media/gold-wax-envelope.jpg",
  candleFlameMacroImage: "/media/flame-macro.jpg",

  // Các lớp ảnh chụp thật bằng máy ảnh DSLR phục vụ cảnh Bánh Kem & Thắp Nến 3 giây
  // (toàn bộ 6 cây nến đã được phối đồng bộ sắc Vàng Hoàng Kim & Bạch Kim Ngà hợp Mệnh Kim):
  cakeUnlitImage: "/media/cake-unlit.jpg",
  cakeBodyLitImage: "/media/cake-body-lit.jpg",
  cakeFlamesImage: "/media/cake-flames.jpg",

  // Các ảnh chụp thật từ máy ảnh cho phông nền bokeh ống kính 50mm f/1.4,
  // bàn gỗ cổ, giấy viết tay sợi bông và bầu trời đêm dải Ngân Hà.
  cinemaBokehImage: "/media/cinema-bokeh.jpg",
  goldenOrbBokehImage: "/media/golden-orb-bokeh.jpg",
  deskEnvelopesImage: "/media/hogwarts-desk-gold.jpg",
  cottonPaperImage: "/media/cotton-paper.webp",
  kraftPaperImage: "/media/kraft-paper.webp",
  nightSkyImage: "/media/night-sky.webp",
  deepGalaxyImage: "/media/galaxy-deep.webp",

  // Ảnh kỷ niệm nhỏ dạng Polaroid kẹp ghim đồng vàng ở góc trên bên phải tờ giấy tâm sự.
  letterPolaroidPhoto: "/media/memory-1.jpg",

  // Danh sách ảnh kỷ niệm tông Vàng Hoàng Kim - Sâm Panh - Kem Ngà hợp Mệnh Kim
  // dùng để ghép thành hình trái tim 46 mảnh và xem phóng to trong album Polaroid 35mm.
  // Khi muốn thay bằng ảnh thật của người nhận, bạn chép ảnh vào public/media rồi sửa đường dẫn bên dưới.
  photos: [
    "/media/memory-1.jpg",
    "/media/memory-2-gold.jpg",
    "/media/memory-3.webp",
    "/media/memory-4-gold.jpg",
    "/media/memory-5-gold.jpg",
    "/media/memory-6-gold.jpg",
  ] as string[],

  // Dòng chú thích kỷ niệm hiển thị dưới mỗi bức ảnh khi mở chế độ xem ảnh Polaroid chi tiết.
  photoCaptions: [
    "Ánh pháo bông vàng kim lấp lánh trong đêm như nụ cười rạng rỡ của cậu",
    "Đóa hồng vàng sâm panh dịu dàng chúc tuổi mới viên mãn và thịnh vượng",
    "Chút ngọt ngào ấm áp cho một ngày sinh nhật thật đáng nhớ",
    "Những đốm sáng hoàng kim gom lại thành muôn vàn điều may mắn",
    "Chiều hoàng hôn ánh vàng khép lại mọi muộn phiền của năm cũ",
    "Mỗi cánh hoa bạch kim ngà là một lời chúc bình an gửi đến bên cậu",
  ],

  // Các câu tâm sự hiện lên từng câu một sau khi thắp nến xong:
  // Câu trước hiện rõ -> dừng lại để đọc -> mờ dần tan đi -> câu tiếp theo xuất hiện (tổng ~16 giây).
  thoughts: [
    "Hôm nay là ngày thế giới dịu dàng đón cậu đến với cuộc đời này…",
    "Cảm ơn cậu vì đã luôn kiên cường, tỏa sáng theo cách riêng ngay cả trong những ngày lặng lẽ nhất.",
    "Mong tuổi mới của cậu rực rỡ ánh vàng may mắn, ngập tràn tiếng cười và những buổi chiều thảnh thơi.",
    "Trước khi bước vào hành trình mới, hãy chọn một phong thư ấn sáp vàng dành riêng cho mình nhé.",
  ],

  // Nội dung trên tờ giấy thủ công: chữ sẽ hiện ra mượt mà như nét bút mực viết tay trong đúng 10 giây.
  letter: `Tớ không giỏi nói mấy lời hoa mỹ, nên viết đơn giản thôi: chúc mừng sinh nhật cậu nha.

Năm vừa rồi chắc chẳng dễ dàng gì, vậy mà cậu vẫn đi tới được hôm nay — vững vàng và giỏi hơn cậu nghĩ nhiều đấy.

Tớ chỉ mong tuổi mới mọi điều thuận lợi hanh thông đến với cậu, ăn ngon ngủ đủ, bớt lo một chút, và luôn dịu dàng với chính mình nhiều hơn nữa nhé.`,

  // Lời nhắn trang trọng trong khung viền nhũ vàng 24K trước khi điều ước hóa thành ngôi sao.
  finalBlessing:
    "Mong điều ước cậu chọn — và cả lá thư nhỏ ánh vàng này — thật sự tìm được đường đến với cậu trong năm mới.",
};

// Bốn lá thư nguyện ước tương ứng 4 lĩnh vực: Công việc, Tình yêu, Sức khỏe, Tinh thần.
// Tất cả đều sử dụng Ấn Sáp Vàng Hoàng Kim / Đồng Cổ / Bạch Kim hợp phong thủy Mệnh Kim.
export const wishes = [
  {
    id: "work",
    title: "Công việc",
    subtitle: "Hanh thông & tỏa sáng rực rỡ",
    sealLabel: "KIM BẢNG • SỰ NGHIỆP",
    postmarkCode: "NO. 01 • AURUM",
    sealHueRotate: "0deg",
    warmSpotlight: "rgba(248, 204, 112, 0.28)",
    tiltDeg: -1.35,
    icon: "✦",
    message:
      "Chúc con đường công việc và những dự định của cậu ngày càng hanh thông, vững vàng như vàng mười. Mong mọi cố gắng âm thầm đều kết trái ngọt để cậu luôn tự hào về hành trình mình đang đi.",
  },
  {
    id: "love",
    title: "Tình yêu",
    subtitle: "Luôn được trân trọng & vỗ về",
    sealLabel: "HOÀNG KIM • YÊU THƯƠNG",
    postmarkCode: "NO. 02 • LUMEN",
    sealHueRotate: "-6deg",
    warmSpotlight: "rgba(255, 218, 138, 0.28)",
    tiltDeg: 1.05,
    icon: "✧",
    message:
      "Chúc trái tim cậu luôn được nâng niu, được thấu hiểu và ở cạnh những người khiến cậu thấy an toàn nhất khi là chính mình. Hôm nay cậu xứng đáng nhận về thật nhiều ấm áp và thương mến.",
  },
  {
    id: "health",
    title: "Sức khỏe",
    subtitle: "Thân khỏe mạnh, giấc ngủ an lành",
    sealLabel: "BẠCH KIM • BÌNH AN",
    postmarkCode: "NO. 03 • VITA",
    sealHueRotate: "8deg",
    warmSpotlight: "rgba(238, 208, 132, 0.25)",
    tiltDeg: -0.85,
    icon: "☼",
    message:
      "Chúc cậu một tuổi mới dồi dào sức khỏe, ăn ngon miệng, ngủ thật sâu và luôn tràn đầy sinh lực tươi sáng để tận hưởng trọn vẹn từng chuyến đi, từng niềm vui phía trước.",
  },
  {
    id: "spirit",
    title: "Tinh thần",
    subtitle: "Nhẹ nhõm & bình yên từ bên trong",
    sealLabel: "TỊNH KIM • AN NHIÊN",
    postmarkCode: "NO. 04 • PAX",
    sealHueRotate: "-12deg",
    warmSpotlight: "rgba(245, 224, 168, 0.25)",
    tiltDeg: 1.25,
    icon: "☾",
    message:
      "Mong cậu luôn giữ được một khoảng trời trong trẻo và tĩnh tại trong tâm hồn, biết gác lại âu lo khi mỏi mệt và mỉm cười thật tươi trước những điều nhỏ bé đáng yêu mỗi ngày.",
  },
] as const;

// Kiểu dữ liệu cho từng lá thư điều ước.
export type WishItem = (typeof wishes)[number];
