"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardConfig } from "../card-config";

// ============================================================================
// MÀN HÌNH TỜ GIẤY THỦ CÔNG XÉ VIỀN & CHỮ MỰC VIẾT TAY 10 GIÂY
// (HandwrittenLetterStage.tsx)
// Tái hiện chân thực tờ thư viết tay dưới ánh đèn bàn ấm trong phòng tối:
// - Bề mặt giấy sử dụng ảnh chụp cận cảnh sợi giấy thật từ máy ảnh DSLR (kraft-paper.webp)
//   pha sắc kem ngà ấm, kết hợp bộ lọc quang học SVG feDisplacementMap tạo mép xé sợi bông
//   tự nhiên như giấy xé tay thật (không còn đường cắt đa giác cứng).
// - Kẹp giấy kim loại 3D có độ bóng thép và bóng đổ thật giữ nghiêng tấm ảnh Polaroid ở góc phải.
// - Kỹ thuật chạy chữ mực ướt không nhảy dòng (Zero-Reflow Wet-Ink Reveal):
//   Nét mực nâu đen thấm dần lên thớ giấy trong đúng 10 giây, sau đó mở nút gửi điều ước.
// ============================================================================

interface HandwrittenLetterStageProps {
  letterText: string;
  recipient: string;
  sender: string;
  polaroidPhotoUrl: string;
  onContinue: () => void;
}

interface ParsedParagraph {
  words: Array<{
    chars: Array<{ char: string; globalIdx: number }>;
  }>;
}

export default function HandwrittenLetterStage({
  letterText,
  recipient,
  sender,
  polaroidPhotoUrl,
  onContinue,
}: HandwrittenLetterStageProps) {
  const [isDoneWriting, setIsDoneWriting] = useState(false);
  const charSpansRef = useRef<Array<HTMLSpanElement | null>>([]);
  const skipRequestedRef = useRef(false);

  // Tách văn bản thành Đoạn -> Từ -> Ký tự có chỉ số toàn cục để giữ bố cục cố định 100%,
  // chữ không bao giờ bị giật hay nhảy xuống dòng giữa chừng khi đang viết.
  const { paragraphs, totalChars } = useMemo(() => {
    const rawParas = letterText.split(/\n\s*\n/);
    let counter = 0;
    const parsed: ParsedParagraph[] = rawParas.map((para) => {
      const rawWords = para.trim().split(/\s+/);
      const words = rawWords.map((w, wIdx) => {
        const fullToken = wIdx < rawWords.length - 1 ? `${w} ` : w;
        const chars = Array.from(fullToken).map((ch) => ({
          char: ch,
          globalIdx: counter++,
        }));
        return { chars };
      });
      return { words };
    });
    return { paragraphs: parsed, totalChars: Math.max(1, counter) };
  }, [letterText]);

  useEffect(() => {
    charSpansRef.current = charSpansRef.current.slice(0, totalChars);

    for (let i = 0; i < totalChars; i++) {
      const el = charSpansRef.current[i];
      if (el) {
        el.style.opacity = "0";
      }
    }

    const writeDurationMs = 10000; // Chuẩn 10 giây viết thư mượt mà
    const inkWindow = 4.5; // Vùng chuyển tiếp nét mực ướt đang thấm khô vào thớ giấy
    const startTime = performance.now();
    let settledUntil = 0;
    let rafId = 0;

    const animateWriting = (now: number) => {
      if (skipRequestedRef.current) {
        for (let i = settledUntil; i < totalChars; i++) {
          const el = charSpansRef.current[i];
          if (el) {
            el.style.opacity = "1";
            el.style.filter = "none";
            el.style.transform = "none";
          }
        }
        setIsDoneWriting(true);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / writeDurationMs));
      const headCursor = progress * (totalChars + inkWindow);

      const upperIdx = Math.min(totalChars - 1, Math.ceil(headCursor));
      for (let i = settledUntil; i <= upperIdx; i++) {
        const el = charSpansRef.current[i];
        if (!el) continue;

        const alpha = Math.min(1, Math.max(0, (headCursor - i) / inkWindow));
        if (alpha >= 0.995) {
          el.style.opacity = "1";
          el.style.filter = "none";
          el.style.transform = "none";
          if (i === settledUntil) settledUntil = i + 1;
        } else if (alpha > 0) {
          const softBlur = (1 - alpha) * 1.25;
          const liftY = (1 - alpha) * 1.8;
          el.style.opacity = alpha.toFixed(3);
          el.style.filter = `blur(${softBlur.toFixed(2)}px)`;
          el.style.transform = `translate3d(0, ${liftY.toFixed(2)}px, 0)`;
        }
      }

      if (progress < 1) {
        rafId = window.requestAnimationFrame(animateWriting);
      } else {
        setIsDoneWriting(true);
      }
    };

    rafId = window.requestAnimationFrame(animateWriting);
    return () => window.cancelAnimationFrame(rafId);
  }, [totalChars]);

  const finishImmediately = () => {
    skipRequestedRef.current = true;
  };

  return (
    <div className="letter-cinema-stage stage-fade-in">
      {/* Bộ lọc SVG tạo viền giấy xé sợi tự nhiên (Organic Deckle Torn Paper Edge) */}
      <svg className="sr-svg-defs" aria-hidden="true">
        <defs>
          <filter id="organic-paper-edge" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045"
              numOctaves="4"
              seed="17"
              result="paperNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="paperNoise"
              scale="5.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <p className="cinema-eyebrow">LÁ THƯ VIẾT TAY</p>

      {/* Khung bao đổ bóng sâu xuống mặt bàn tối bên dưới tờ thư */}
      <div className="torn-paper-shadow-wrap">
        {/* Tấm ảnh Polaroid nhỏ kẹp nghiêng ở góc trên bên phải bằng ghim thép 3D */}
        <div className="letter-corner-polaroid" aria-hidden="true">
          <svg
            className="realistic-steel-clip"
            viewBox="0 0 28 58"
            fill="none"
            aria-hidden="true"
          >
            {/* Bóng đổ của chiếc kẹp giấy lên bề mặt ảnh Polaroid */}
            <path
              d="M9 14 V44 C9 49.5 19 49.5 19 44 V10 C19 4.5 6 4.5 6 11 V39"
              stroke="rgba(22, 16, 14, 0.34)"
              strokeWidth="3.2"
              strokeLinecap="round"
              transform="translate(1.6, 2.2)"
            />
            {/* Thân dây đồng mạ vàng 24K sáng bóng của chiếc kẹp giấy thật hợp Mệnh Kim */}
            <path
              d="M9 14 V44 C9 49.5 19 49.5 19 44 V10 C19 4.5 6 4.5 6 11 V39"
              stroke="url(#brassGoldGrad)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="brassGoldGrad" x1="4" y1="4" x2="22" y2="52" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fff7df" />
                <stop offset="45%" stopColor="#c6933c" />
                <stop offset="78%" stopColor="#fce8b2" />
                <stop offset="100%" stopColor="#7a5318" />
              </linearGradient>
            </defs>
          </svg>

          <div
            className="corner-polaroid-img"
            style={{ backgroundImage: `url("${polaroidPhotoUrl}")` }}
          >
            <span className="polaroid-gloss-sheen" />
          </div>
        </div>

        {/* Tờ giấy sợi bông thủ công chụp thật có ánh đèn vàng ấm chiếu xiên từ góc trái trên */}
        <article
          className="torn-handmade-paper"
          aria-label={`Lá thư viết tay gửi ${recipient}`}
        >
          {/* Bề mặt sợi giấy chụp cận cảnh bằng ống kính Macro DSLR */}
          <div className="paper-deckle-surface" aria-hidden="true">
            <div
              className="paper-macro-fibers"
              style={{ backgroundImage: `url("${cardConfig.kraftPaperImage}")` }}
            />
            <div className="paper-lamp-vignette" />
          </div>

          <p className="handwritten-salutation">Gửi {recipient} thương mến,</p>

          <div className="handwritten-paragraphs">
            {paragraphs.map((para, pIdx) => (
              <p key={pIdx} className="handwritten-para">
                {para.words.map((wordObj, wIdx) => (
                  <span key={wIdx} className="handwritten-word">
                    {wordObj.chars.map(({ char, globalIdx }) => (
                      <span
                        key={globalIdx}
                        ref={(el) => {
                          charSpansRef.current[globalIdx] = el;
                        }}
                        className="handwritten-char"
                      >
                        {char === " " ? "\u00A0" : char}
                      </span>
                    ))}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <p className={`handwritten-signature ${isDoneWriting ? "visible" : ""}`}>
            Thương mến, {sender} ✦
          </p>
        </article>
      </div>

      {/* Điều khiển phía dưới tờ thư */}
      <div className="letter-bottom-controls">
        {isDoneWriting ? (
          <button
            type="button"
            className="cinema-pill-btn golden-glow stage-fade-in"
            onClick={onContinue}
          >
            Gửi điều ước cho sao băng <span aria-hidden="true">✦</span>
          </button>
        ) : (
          <div className="writing-progress-row">
            <span className="writing-feather-status">
              Từng dòng mực đang viết gửi đến {recipient}…
            </span>
            <button
              type="button"
              className="cinema-skip-btn"
              onClick={finishImmediately}
            >
              Hiện trọn lá thư
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
