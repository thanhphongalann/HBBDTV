"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { WishItem } from "../card-config";

// ============================================================================
// MÀN HÌNH LỜI CHÚC & TRÁI TIM GHÉP TỪ 46 TẤM ẢNH RỬA PHIM THẬT
// (HeartResultStage.tsx)
// Tái hiện chân thực bố cục ảnh kỷ niệm xếp hình Trái Tim trên nền tối điện ảnh:
// - 46 tấm ảnh mini in viền trắng ngà hơi xoay nghiêng tự nhiên như những tấm ảnh thật
//   được xếp tay tạo thành hình Trái Tim đầy đặn, có độ bóng giấy ảnh và bóng đổ sâu.
// - Khi người nhận chạm vào bất kỳ tấm ảnh nào, hộp xem ảnh Polaroid 35mm mở ra
//   với lớp tráng bạc phản quang nhẹ và dòng chú thích viết tay bên dưới.
// ============================================================================

interface HeartResultStageProps {
  selectedWish: WishItem;
  recipient: string;
  photos: string[];
  photoCaptions: string[];
  onOpenLetter: () => void;
  onChooseAnotherWish: () => void;
}

// Ma trận 9 cột x 8 hàng tạo hình trái tim cân đối từ đúng 46 tấm ảnh kỷ niệm.
const HEART_MATRIX: number[][] = [
  [0, 1, 1, 0, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
];

export default function HeartResultStage({
  selectedWish,
  recipient,
  photos,
  photoCaptions,
  onOpenLetter,
  onChooseAnotherWish,
}: HeartResultStageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const validPhotos = photos.length > 0 ? photos : ["/media/memory-1.jpg"];

  // Hỗ trợ điều hướng bàn phím Trái / Phải / Escape khi mở xem ảnh Polaroid chi tiết.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => ((prev ?? 0) + 1) % validPhotos.length);
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex(
          (prev) => ((prev ?? 0) - 1 + validPhotos.length) % validPhotos.length
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, validPhotos.length]);

  let runningTileIdx = 0;

  return (
    <div className="heart-result-stage stage-fade-in">
      {/* Quầng sáng vàng hổ phách dịu ấm phía sau khối ảnh trái tim */}
      <div className="heart-mosaic-aura" aria-hidden="true" />

      {/* Khối Trái Tim 46 tấm ảnh mini in giấy lụa có độ nghiêng tự nhiên như xếp tay */}
      <div className="heart-mosaic-wrapper">
        <div
          className="heart-mosaic-grid"
          role="group"
          aria-label="Trái tim ghép từ 46 bức ảnh kỷ niệm"
        >
          {HEART_MATRIX.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              if (cell === 0) {
                return <span key={`${rIdx}-${cIdx}`} className="heart-cell-empty" />;
              }

              const tileOrder = runningTileIdx++;
              const photoIdx = tileOrder % validPhotos.length;
              const imgUrl = validPhotos[photoIdx];
              const distCenter = Math.hypot(cIdx - 4, rIdx - 3);
              // Độ xoay vi mô (-1.8deg .. +1.8deg) giúp từng tấm ảnh trông như ảnh in thật đặt cạnh nhau.
              const microTilt = (((rIdx * 11 + cIdx * 17) % 7) - 3) * 0.6;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  className="heart-photo-tile"
                  style={
                    {
                      backgroundImage: `url("${imgUrl}")`,
                      animationDelay: `${Math.round(distCenter * 72)}ms`,
                      "--tile-tilt": `${microTilt.toFixed(2)}deg`,
                    } as React.CSSProperties
                  }
                  onClick={() => setLightboxIndex(photoIdx)}
                  aria-label={`Xem bức ảnh kỷ niệm số ${photoIdx + 1}`}
                />
              );
            })
          )}
        </div>

        <button
          type="button"
          className="heart-open-gallery-hint"
          onClick={() => setLightboxIndex(0)}
        >
          Chạm vào trái tim để lật xem từng tấm ảnh <span>♡</span>
        </button>
      </div>

      <p className="heart-small-dedication">
        Tất cả những khoảnh khắc dịu dàng tớ gói ghém dành cho cậu.
      </p>

      <h1 className="heart-birthday-headline">
        Chúc Mừng Sinh Nhật, <em>{recipient}.</em>
      </h1>

      <p className="heart-sub-celebrate">Hôm nay cậu nhất định phải thật hạnh phúc nhé.</p>

      {/* Khung hiển thị nội dung lời chúc của phong thư đã mở */}
      <div className="selected-wish-glass-box">
        <div className="selected-wish-badge">
          <span>{selectedWish.icon}</span> LỜI CHÚC VỀ {selectedWish.title.toUpperCase()}
        </div>
        <p className="selected-wish-body">{selectedWish.message}</p>
      </div>

      {/* Điều hướng mở sang tờ thư viết tay hoặc quay lại mở thêm phong thư khác */}
      <div className="heart-stage-actions">
        <button type="button" className="cinema-pill-btn golden-glow" onClick={onOpenLetter}>
          Có một lá thư dành cho cậu <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="cinema-ghost-link"
          onClick={onChooseAnotherWish}
        >
          Mở xem một phong thư nguyện ước khác
        </button>
      </div>

      {/* Hộp xem ảnh Polaroid 35mm thực tế khi người nhận bấm vào ảnh */}
      {lightboxIndex !== null && (
        <div
          className="polaroid-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Album ảnh kỷ niệm Polaroid"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="polaroid-lightbox-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="polaroid-close-btn"
              onClick={() => setLightboxIndex(null)}
              aria-label="Đóng khung xem ảnh"
            >
              ×
            </button>

            <div className="polaroid-frame-paper">
              <div className="polaroid-photo-viewport">
                <Image
                  src={validPhotos[lightboxIndex]}
                  alt={
                    photoCaptions[lightboxIndex] ??
                    `Kỷ niệm số ${lightboxIndex + 1}`
                  }
                  fill
                  sizes="(max-width: 520px) 92vw, 440px"
                  className="polaroid-main-img"
                />
                <span className="polaroid-gloss-sheen" aria-hidden="true" />
                <span className="film-timestamp-stamp">
                  35MM PORTRA • {String(lightboxIndex + 1).padStart(2, "0")}/
                  {String(validPhotos.length).padStart(2, "0")}
                </span>
              </div>
              <p className="polaroid-hand-caption">
                {photoCaptions[lightboxIndex % photoCaptions.length] ??
                  `Khoảnh khắc đáng nhớ dành cho ${recipient}`}
              </p>
            </div>

            <div className="polaroid-controls-row">
              <button
                type="button"
                className="polaroid-nav-btn"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + validPhotos.length) % validPhotos.length
                  )
                }
                aria-label="Ảnh trước"
              >
                ← Trước
              </button>

              <div className="polaroid-filmstrip">
                {validPhotos.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`filmstrip-thumb ${idx === lightboxIndex ? "active" : ""}`}
                    style={{ backgroundImage: `url("${src}")` }}
                    onClick={() => setLightboxIndex(idx)}
                    aria-label={`Chọn ảnh ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="polaroid-nav-btn"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % validPhotos.length)
                }
                aria-label="Ảnh tiếp theo"
              >
                Tiếp →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
