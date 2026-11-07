"use client";

import { useEffect, useState } from "react";

// ============================================================================
// MÀN HÌNH DÒNG TÂM SỰ HIỆN DẦN & TAN MỜ MƯỢT MÀ (ThoughtsStage.tsx)
// Sau khi bánh kem và ngọn nến tan biến:
// - Từng câu tâm sự hiện lên theo nhịp từng chữ có độ mờ tiêu cự (optical blur-in).
// - Dừng lại vừa đủ để người nhận đọc trọn vẹn cảm xúc.
// - Sau đó câu cũ mờ dần hoàn toàn (fade & blur out) rồi câu mới mới xuất hiện,
//   tổng thời lượng khoảng 16–17 giây đúng chuẩn nhịp phim điện ảnh.
// ============================================================================

interface ThoughtsStageProps {
  thoughts: string[];
  onComplete: () => void;
}

type LinePhase = "entering" | "reading" | "exiting";

export default function ThoughtsStage({ thoughts, onComplete }: ThoughtsStageProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<LinePhase>("entering");

  useEffect(() => {
    // Sau 90ms kích hoạt trạng thái hiển thị rõ từng từ trên màn hình.
    const readTimer = window.setTimeout(() => {
      setPhase("reading");
    }, 90);

    // Sau 3.35 giây bắt đầu làm mờ dần câu hiện tại đi.
    const exitTimer = window.setTimeout(() => {
      setPhase("exiting");
    }, 3350);

    // Sau 4.25 giây (khi câu cũ đã mờ hẳn), đặt lại trạng thái cho câu kế tiếp hoặc sang 4 Lá Thư.
    const nextTimer = window.setTimeout(() => {
      if (index < thoughts.length - 1) {
        setPhase("entering");
        setIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    }, 4250);

    return () => {
      window.clearTimeout(readTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(nextTimer);
    };
  }, [index, onComplete, thoughts.length]);

  const currentSentence = thoughts[index] ?? "";
  const words = currentSentence.split(" ");

  return (
    <div className="thoughts-cinema-stage stage-fade-in">
      {/* Ánh sáng ấm chiếu nhẹ ở tâm khung hình như đèn chiếu phim */}
      <div className="thoughts-spotlight" aria-hidden="true" />

      <p className="cinema-eyebrow">ĐÔI DÒNG GỬI CẬU</p>

      {/* Vùng hiển thị từng câu tâm sự với hiệu ứng từng từ nổi nét mượt mà */}
      <div className="thought-sentence-stage" aria-live="polite">
        <p key={index} className={`thought-cinematic-line is-${phase}`}>
          {words.map((word, wIdx) => (
            <span
              key={`${index}-${wIdx}`}
              className="thought-word"
              style={{
                transitionDelay:
                  phase === "exiting" ? `${wIdx * 18}ms` : `${wIdx * 62}ms`,
              }}
            >
              {word}&nbsp;
            </span>
          ))}
        </p>
      </div>

      {/* Các chấm sáng nhỏ báo tiến trình số câu tâm sự */}
      <div className="thoughts-dots" aria-hidden="true">
        {thoughts.map((_, dotIdx) => (
          <span
            key={dotIdx}
            className={`thought-dot ${dotIdx === index ? "active" : ""} ${dotIdx < index ? "passed" : ""}`}
          />
        ))}
      </div>

      <button type="button" className="cinema-skip-btn" onClick={onComplete}>
        Tiếp tục mở điều ước <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
