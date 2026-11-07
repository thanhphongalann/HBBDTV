"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cardConfig, type WishItem } from "../card-config";

// ============================================================================
// MÀN HÌNH LỜI CHÚC TRẢI TRÊN GIẤY CỔ & TRÁI TIM 46 TẤM ẢNH RỬA PHIM THẬT
// (HeartResultStage.tsx)
// Nối tiếp liền mạch ngay sau khi tờ nguyện ước được rút ra từ phong bì Ấn Sáp Vàng:
// - Bố cục 2 cột cân đối trên máy tính (và xếp dọc thoáng đãng trên điện thoại) giúp
//   toàn bộ nội dung lời chúc, trái tim ảnh và nút điều hướng hiển thị trọn vẹn,
//   tuyệt đối không bị tràn cụt mất phần dưới màn hình.
// - Lời chúc được trình bày trên tờ giấy sợi bông xé viền thật (kraft-paper.webp +
//   SVG feDisplacementMap) thay cho khung kính cứng, với từng chữ mực nâu thấm hiện ra
//   mượt mà như đang mở đọc lá thư thật dưới ánh nến vàng.
// - Khối Trái Tim 46 tấm ảnh in lụa cho phép chạm vào mở Album Polaroid 35mm chi tiết.
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
  const [inkRevealed, setInkRevealed] = useState(false);

  const validPhotos = photos.length > 0 ? photos : ["/media/memory-1.jpg"];

  // Tách nội dung lời chúc thành từng từ để tạo hiệu ứng chữ mực hiện dần mượt mà
  // ngay sau khi tờ giấy da dê vừa mở phẳng ra khỏi phong bì.
  const wishWords = useMemo(
    () => selectedWish.message.trim().split(/\s+/),
    [selectedWish.message]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInkRevealed(true);
    }, 110);
    return () => window.clearTimeout(timer);
  }, [selectedWish.id]);

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
  const totalRevealDelayMs = wishWords.length * 46 + 420;

  return (
    <div className="heart-result-stage">
      {/* Bộ lọc quang học SVG tạo mép giấy xé sợi bông tự nhiên cho tờ lời chúc */}
      <svg className="sr-svg-defs" aria-hidden="true">
        <defs>
          <filter id="wish-slip-deckle" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.048"
              numOctaves="4"
              seed="9"
              result="deckleNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="deckleNoise"
              scale="4.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="heart-result-showcase">
        {/* CỘT 1: Khối Trái Tim 46 tấm ảnh mini in giấy lụa có độ nghiêng tự nhiên như xếp tay */}
        <div className="heart-mosaic-column">
          <div className="heart-mosaic-aura" aria-hidden="true" />

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
                          animationDelay: `${Math.round(distCenter * 68 + 180)}ms`,
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
              <span>✦</span> Chạm vào trái tim để lật xem từng tấm ảnh kỷ niệm <span>✦</span>
            </button>
          </div>
        </div>

        {/* CỘT 2: Tờ giấy nguyện ước vừa rút ra từ phong bì cổ, chữ mực hiện mượt từng từ */}
        <div className="wish-parchment-column">
          <p className="heart-small-dedication">
            Tờ nguyện ước vừa mở ra dành riêng cho cậu
          </p>

          <h1 className="heart-birthday-headline">
            Chúc Mừng Sinh Nhật, <em>{recipient}.</em>
          </h1>

          {/* Tờ giấy sợi bông xé viền thật mang nội dung lời chúc (thay cho khung hộp giả) */}
          <article
            className="unsealed-wish-parchment"
            aria-label={`Nội dung lời chúc về ${selectedWish.title}`}
          >
            <div className="wish-parchment-surface" aria-hidden="true">
              <div
                className="wish-parchment-fibers"
                style={{ backgroundImage: `url("${cardConfig.kraftPaperImage}")` }}
              />
              <div className="wish-parchment-vignette" />
            </div>

            {/* Huy hiệu Ấn Sáp Vàng dập nổi ở đầu tờ nguyện ước */}
            <div className="wish-parchment-header">
              <span className="wish-wax-medallion" aria-hidden="true">
                {selectedWish.icon}
              </span>
              <span className="wish-parchment-kicker">
                {selectedWish.sealLabel}
              </span>
            </div>

            {/* Từng chữ mực nâu sẫm thấm dần rõ nét trên mặt giấy da dê */}
            <p className={`wish-parchment-body ${inkRevealed ? "is-revealed" : ""}`}>
              {wishWords.map((word, wIdx) => (
                <span
                  key={`${selectedWish.id}-${wIdx}`}
                  className="wish-ink-word"
                  style={{ transitionDelay: `${wIdx * 46}ms` }}
                >
                  {word}{" "}
                </span>
              ))}
            </p>

            <div
              className={`wish-parchment-flourish ${inkRevealed ? "is-revealed" : ""}`}
              style={{ transitionDelay: `${Math.min(1800, totalRevealDelayMs - 250)}ms` }}
              aria-hidden="true"
            >
              ─── ✦ ───
            </div>
          </article>

          {/* Cụm điều hướng phong cách điện ảnh không viền hộp thô */}
          <div className="heart-stage-actions">
            <button
              type="button"
              className="cinema-pill-btn golden-glow"
              onClick={onOpenLetter}
            >
              <span>Đọc lá thư viết tay dành cho cậu</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="cinema-ghost-link"
              onClick={onChooseAnotherWish}
            >
              ↺ Mở xem một phong thư nguyện ước khác
            </button>
          </div>
        </div>
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
              × Đóng
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
                  35MM GOLD • {String(lightboxIndex + 1).padStart(2, "0")}/
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
                ← Ảnh trước
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
                Ảnh tiếp →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
