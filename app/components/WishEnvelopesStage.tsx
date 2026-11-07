"use client";

import { useState } from "react";
import { cardConfig, type WishItem } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// MÀN HÌNH 4 PHONG THƯ NIÊM PHONG SÁP CHỤP THẬT (WishEnvelopesStage.tsx)
// Thay thế hoàn toàn hình vẽ tam giác CSS bằng ảnh chụp thật phong bì giấy cổ
// có nếp gấp tự nhiên và con dấu sáp nung chảy dập nổi (wax-envelope.webp),
// đặt trên mặt bàn gỗ ấm mờ hậu cảnh (desk-envelopes.jpg):
// - 4 lá thư đại diện cho: Công việc — Tình yêu — Sức khỏe — Tinh thần.
// - Chữ tiêu đề được in thấm mực trực tiếp lên thớ giấy kem bên dưới con dấu sáp
//   kèm ánh đèn vàng ấm chiếu tập trung (chiaroscuro spotlight) hòa vào phòng tối.
// ============================================================================

interface WishEnvelopesStageProps {
  wishes: readonly WishItem[];
  recipient: string;
  onSelectWish: (wishId: WishItem["id"]) => void;
}

export default function WishEnvelopesStage({
  wishes,
  recipient,
  onSelectWish,
}: WishEnvelopesStageProps) {
  const [openingId, setOpeningId] = useState<WishItem["id"] | null>(null);

  // Xử lý hiệu ứng nâng phong thư tiến gần ống kính máy ảnh trước khi mở lời chúc.
  const handlePick = (id: WishItem["id"]) => {
    if (openingId) return;
    setOpeningId(id);
    soundEngine.playWishSelect();
    window.setTimeout(() => {
      onSelectWish(id);
    }, 680);
  };

  return (
    <div className="wishes-cinema-stage stage-fade-in">
      {/* Hậu cảnh mặt bàn gỗ tối chụp từ máy ảnh DSLR tạo chiều sâu vật lý dưới 4 phong bì */}
      <div
        className="wishes-desk-backdrop"
        style={{ backgroundImage: `url("${cardConfig.deskEnvelopesImage}")` }}
        aria-hidden="true"
      />

      <p className="cinema-eyebrow">BỐN PHONG THƯ NGUYỆN ƯỚC</p>
      <h1 className="cinema-serif-title">
        Dành cho tuổi mới của <em>{recipient}</em>
      </h1>
      <p className="cinema-subtitle">
        Chạm nhẹ vào phong thư niêm phong sáp mà trái tim cậu muốn mở ra nhất lúc này…
      </p>

      {/* Lưới 4 phong bì giấy thủ công chụp thật đặt hơi nghiêng tự nhiên trên mặt bàn */}
      <div className="wish-envelopes-grid">
        {wishes.map((wish, idx) => {
          const isOpening = openingId === wish.id;
          const isDimmed = openingId !== null && !isOpening;

          return (
            <button
              key={wish.id}
              type="button"
              className={`real-wax-envelope-card ${isOpening ? "is-opening" : ""} ${isDimmed ? "is-dimmed" : ""}`}
              onClick={() => handlePick(wish.id)}
              style={
                {
                  animationDelay: `${idx * 105}ms`,
                  "--card-tilt": `${wish.tiltDeg}deg`,
                  "--wish-spotlight": wish.warmSpotlight,
                } as React.CSSProperties
              }
              aria-label={`Mở phong thư nguyện ước về ${wish.title}`}
            >
              {/* Khung giấy phong bì chụp thật (phóng nhẹ 108% để cắt sạch viền ngoài bản quét) */}
              <span className="real-envelope-photo-wrap" aria-hidden="true">
                <span
                  className="real-envelope-photo"
                  style={{
                    backgroundImage: `url("${cardConfig.waxEnvelopeImage}")`,
                    filter: `sepia(0.14) contrast(1.06) brightness(0.86) hue-rotate(${wish.sealHueRotate})`,
                  }}
                />
                {/* Lớp ánh đèn nến vàng ấm chiếu vào tâm phong bì, làm dịu 4 góc giấy */}
                <span className="real-envelope-lighting" />
              </span>

              {/* Dấu bưu ấn nhỏ ở góc trên của phong thư */}
              <span className="envelope-postmark-code" aria-hidden="true">
                {wish.postmarkCode}
              </span>

              {/* Chữ in mực nâu sẫm thấm trực tiếp trên nền giấy kem dưới con dấu sáp */}
              <span className="real-envelope-ink-meta">
                <span className="real-envelope-tag">{wish.sealLabel}</span>
                <strong className="real-envelope-title">{wish.title}</strong>
                <span className="real-envelope-sub">{wish.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
