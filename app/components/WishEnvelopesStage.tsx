"use client";

import { useState } from "react";
import { cardConfig, type WishItem } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// MÀN HÌNH 4 PHONG THƯ NIÊM PHONG ẤN SÁP VÀNG 24K CHỤP THẬT (WishEnvelopesStage.tsx)
// Sử dụng ảnh chụp thật phong bì giấy da dê cổ kèm con dấu sáp vàng 24K nổi khối 3D
// (gold-wax-envelope.jpg) đặt trên mặt bàn gỗ thư pháp cổ (hogwarts-desk-gold.jpg):
// - 4 lá thư đại diện cho: Công việc — Tình yêu — Sức khỏe — Tinh thần.
// - Khi người nhận bấm chọn 1 phong thư: 3 phong thư còn lại mờ dần vào hậu cảnh bokeh,
//   phong thư được chọn tiến ra giữa khung hình, tách Ấn Sáp Vàng 24K và rút nhẹ
//   tờ giấy da dê lời chúc trồi lên từ bên trong phong bì trước khi mở ra trọn vẹn
//   ở màn tiếp theo (không còn bị chuyển cảnh cụt đột ngột).
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

  const activeWish = openingId
    ? wishes.find((w) => w.id === openingId) ?? null
    : null;

  // Khi bấm vào 1 phong thư: kích hoạt nghi thức mở Ấn Sáp Vàng & rút ruột thư giấy cổ (1.35 giây)
  // rồi mới chuyển mượt sang màn đọc nội dung lời chúc.
  const handlePick = (id: WishItem["id"]) => {
    if (openingId) return;
    setOpeningId(id);
    soundEngine.playWishSelect();
    window.setTimeout(() => {
      onSelectWish(id);
    }, 1350);
  };

  return (
    <div className="wishes-cinema-stage stage-fade-in">
      {/* Hậu cảnh mặt bàn gỗ tối chụp từ máy ảnh DSLR tạo chiều sâu vật lý dưới 4 phong bì */}
      <div
        className="wishes-desk-backdrop"
        style={{ backgroundImage: `url("${cardConfig.deskEnvelopesImage}")` }}
        aria-hidden="true"
      />

      <div className={`wishes-grid-content ${openingId ? "is-receding" : ""}`}>
        <p className="cinema-eyebrow">BỐN PHONG THƯ NGUYỆN ƯỚC</p>
        <h1 className="cinema-serif-title">
          Dành cho tuổi mới của <em>{recipient}</em>
        </h1>
        <p className="cinema-subtitle">
          Chạm nhẹ vào phong thư ấn sáp vàng mà trái tim cậu muốn mở ra nhất lúc này…
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
                {/* Khung giấy phong bì & ấn sáp vàng 24K chụp thật */}
                <span className="real-envelope-photo-wrap" aria-hidden="true">
                  <span
                    className="real-envelope-photo"
                    style={{
                      backgroundImage: `url("${cardConfig.waxEnvelopeImage}")`,
                      filter: `sepia(0.08) contrast(1.05) brightness(0.92) hue-rotate(${wish.sealHueRotate})`,
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

      {/* HIỆU ỨNG MỞ PHONG THƯ CẬN CẢNH: Phong bì tiến ra giữa, tách ấn sáp vàng & tờ ruột thư trồi lên */}
      {activeWish && (
        <div className="wish-unsealing-ceremony" aria-live="polite">
          <div className="unsealing-stage-card">
            {/* Tờ giấy sợi bông bên trong trồi mượt từ miệng phong bì lên trên */}
            <div className="emerging-parchment-slip">
              <div
                className="emerging-parchment-grain"
                style={{ backgroundImage: `url("${cardConfig.kraftPaperImage}")` }}
                aria-hidden="true"
              />
              <span className="emerging-slip-kicker">
                {activeWish.icon} {activeWish.sealLabel}
              </span>
              <strong className="emerging-slip-title">
                Lời chúc {activeWish.title} gửi {recipient}…
              </strong>
            </div>

            {/* Thân phong bì giấy cổ & ấn sáp vàng tỏa sáng ở phía trước khi đang rút thư */}
            <div className="unsealing-envelope-pocket" aria-hidden="true">
              <span
                className="unsealing-envelope-photo"
                style={{
                  backgroundImage: `url("${cardConfig.waxEnvelopeImage}")`,
                  filter: `sepia(0.08) contrast(1.06) brightness(0.94) hue-rotate(${activeWish.sealHueRotate})`,
                }}
              />
              <span className="unsealing-seal-gleam" />
            </div>
          </div>

          <p className="unsealing-whisper-caption">
            Đang mở ấn sáp &amp; trải tờ nguyện ước dành cho {recipient}…
          </p>
        </div>
      )}
    </div>
  );
}
