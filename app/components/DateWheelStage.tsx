"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardConfig } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// MÀN HÌNH ĐẦU TIÊN KHI VỪA MỞ LINK: VÒNG SỐ CHẠY DỌC ĐẾN NGÀY SINH NHẬT
// (DateWheelStage.tsx)
// Tái tạo hiệu ứng thước số quay dọc chuẩn điện ảnh như chụp qua ống kính máy ảnh thật:
// - Vừa mở đường dẫn thiệp là vòng số tự động chạy dọc mượt 60–120fps ngay lập tức.
// - Quầng sáng phía sau con số trung tâm được lồng ảnh chụp thật các đĩa bokeh vàng ấm
//   của ống kính khẩu độ lớn (golden-orb-bokeh.jpg) kèm vệt sáng ngang Anamorphic Flare.
// - Hãm tốc tự nhiên theo quán tính cơ học, dừng chính xác ở Ngày & Tháng sinh nhật.
// ============================================================================

interface DateWheelStageProps {
  birthdayDay: number;
  birthdayMonth: number;
  onComplete: () => void;
}

export default function DateWheelStage({
  birthdayDay,
  birthdayMonth,
  onComplete,
}: DateWheelStageProps) {
  const [locked, setLocked] = useState(false);
  const [exiting, setExiting] = useState(false);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const orbRef = useRef<HTMLDivElement>(null);

  // Đảm bảo ngày nằm trong khoảng 1..31 và tháng nằm trong khoảng 1..12.
  const safeDay = Math.min(31, Math.max(1, Math.round(birthdayDay)));
  const safeMonth = Math.min(12, Math.max(1, Math.round(birthdayMonth)));

  // Tạo dải số chạy dọc có đủ quãng trớn quay mượt rồi dừng đúng safeDay,
  // đồng thời giữ các con số lân cận hiển thị mờ dần ở trên và dưới theo trường ảnh nông.
  const { sequence, targetIndex } = useMemo(() => {
    const list: number[] = [];
    const totalSpinSteps = 26;
    for (let step = totalSpinSteps; step >= -3; step--) {
      const val = ((((safeDay - 1 - step) % 31) + 31) % 31) + 1;
      list.push(val);
    }
    return {
      sequence: list,
      targetIndex: totalSpinSteps,
    };
  }, [safeDay]);

  useEffect(() => {
    let rafId = 0;
    let finishTimer: number | null = null;
    let exitTimer: number | null = null;

    const durationMs = 3400; // Thời gian con lăn số cuộn dọc và giảm tốc êm ái
    const rowSpacing = 64;
    const startTime = performance.now();
    let lastWholeIndex = 0;
    let hasLocked = false;

    // Hàm hãm tốc bậc 4 tạo cảm giác vòng xoay cơ học đầm và thật.
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(1, Math.max(0, elapsed / durationMs));
      const easedT = easeOutQuart(rawT);

      const currentPos = easedT * targetIndex;
      const velocity = (1 - rawT) * (1 - rawT);

      // Phát tiếng tách cơ học tinh tế mỗi khi một con số đi qua vạch tâm.
      const wholeIdx = Math.round(currentPos);
      if (wholeIdx !== lastWholeIndex) {
        lastWholeIndex = wholeIdx;
        soundEngine.playWheelTick(easedT);
      }

      // Cập nhật trực tiếp vị trí 3D & độ mờ tiêu cự (DOF + Motion Blur) cho từng con số.
      for (let i = 0; i < sequence.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        const delta = i - currentPos;
        const absDelta = Math.abs(delta);

        if (absDelta > 3.3) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          continue;
        }

        const angleRad = delta * 0.34;
        const yOffset = Math.sin(angleRad) * (rowSpacing * 2.55);
        const scale = Math.max(0.45, 1.18 - absDelta * 0.27);
        const opacity = Math.max(0, 1 - Math.pow(absDelta / 2.85, 1.35));
        const depthBlur = Math.max(0, (absDelta - 0.32) * 1.85) + velocity * 2.8;

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(0, ${yOffset.toFixed(2)}px, 0) rotateX(${(-delta * 19).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.filter = `blur(${depthBlur.toFixed(2)}px)`;

        if (absDelta < 0.38) {
          el.dataset.active = "true";
        } else {
          el.dataset.active = "false";
        }
      }

      // Quầng sáng bokeh ống kính nở ấm dần khi tiến sát đến đúng ngày sinh nhật.
      if (orbRef.current) {
        const glowScale = 0.88 + easedT * 0.24;
        orbRef.current.style.transform = `translate(-50%, -50%) scale(${glowScale.toFixed(3)})`;
      }

      if (rawT < 1) {
        rafId = window.requestAnimationFrame(animate);
      } else if (!hasLocked) {
        hasLocked = true;
        setLocked(true);
        soundEngine.playDateLockChime();

        // Giữ lại khoảnh khắc ngày sinh rực sáng 1.45 giây rồi hòa cảnh sang Bánh Kem thật.
        exitTimer = window.setTimeout(() => {
          setExiting(true);
        }, 1450);

        finishTimer = window.setTimeout(() => {
          onComplete();
        }, 2150);
      }
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (finishTimer) window.clearTimeout(finishTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [onComplete, sequence.length, targetIndex]);

  return (
    <div className={`date-wheel-stage ${exiting ? "stage-fade-out" : "stage-fade-in"}`}>
      {/* Dòng tiêu đề mở đầu tinh tế như tựa phim điện ảnh */}
      <p className="date-wheel-kicker">NGÀY ĐẶC BIỆT CỦA CẬU</p>
      <h1 className="date-wheel-heading">Happy Birthday</h1>

      {/* Khung vòng số chạy dọc với quầng bokeh vàng chụp thật từ ống kính máy ảnh */}
      <div className="date-wheel-viewport" aria-label={`Ngày ${safeDay} tháng ${safeMonth}`}>
        <div
          ref={orbRef}
          className={`date-wheel-sun-orb ${locked ? "is-locked" : ""}`}
          aria-hidden="true"
        >
          <span
            className="date-wheel-bokeh-photo"
            style={{ backgroundImage: `url("${cardConfig.goldenOrbBokehImage}")` }}
          />
        </div>

        {/* Vệt tán xạ ánh sáng ngang mỏng đặc trưng của thấu kính điện ảnh Anamorphic */}
        <div
          className={`date-wheel-anamorphic-streak ${locked ? "is-locked" : ""}`}
          aria-hidden="true"
        />

        {/* Mũi tên chỉ ngày bên trái và nhãn Tháng bên phải cố định trên trục lấy nét */}
        <div className={`date-wheel-center-guides ${locked ? "is-locked" : ""}`}>
          <span className="date-wheel-arrow" aria-hidden="true">
            →
          </span>
          <span className="date-wheel-month">Tháng {safeMonth}</span>
        </div>

        {/* Trục con lăn 3D chứa các con số ngày */}
        <div className="date-wheel-drum">
          {sequence.map((dayNum, idx) => (
            <div
              key={idx}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className="date-wheel-number"
            >
              {String(dayNum).padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>

      <p className={`date-wheel-caption ${locked ? "visible" : ""}`}>
        Một tuổi mới ấm áp bắt đầu từ ngày hôm nay…
      </p>
    </div>
  );
}
