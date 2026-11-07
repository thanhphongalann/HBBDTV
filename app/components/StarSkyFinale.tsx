"use client";

import { useEffect, useRef, useState } from "react";
import { cardConfig } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// MÀN KẾT THÚC ĐỈNH CAO: ĐIỀU ƯỚC HÓA NGÔI SAO & CHẠM SAO BAY VÀO BẦU TRỜI ĐÊM
// (StarSkyFinale.tsx)
// Gồm 3 nhịp tương tác điện ảnh nối tiếp như một bộ phim quay thật:
// 1. Khung thiệp giấy mỹ thuật đen dập nhũ vàng kim (Hot-Foil Stamped Card) + nút gửi điều ước.
// 2. Khi bấm gửi: Khung điều ước tan thành dòng bụi sáng vàng xoáy hội tụ lại thành
//    ĐÚNG 1 NGÔI SAO QUANG HỌC LẤP LÁNH giữa bầu trời đêm dải Ngân Hà chụp thật (night-sky.webp).
// 3. Khi người dùng CHẠM TAY VÀO NGÔI SAO ĐÓ: Máy quay ngước dần từ hàng thông ven hồ
//    lên vùng trời sao sâu thẳm (galaxy-deep.webp), ngôi sao bùng đuôi sao chổi bay vút
//    vào đúng lõi sáng dải Ngân Hà rồi hóa thành một vì sao lấp lánh vĩnh viễn trên cao.
// ============================================================================

interface StarSkyFinaleProps {
  recipient: string;
  sender: string;
  wishTitle: string;
  finalBlessing: string;
  nightSkyImageUrl: string;
  onRestart: () => void;
}

type FinalePhase = "card" | "morphing" | "starReady" | "flying" | "arrived";

interface CosmicParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: "gold" | "ivory" | "blue";
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
}

export default function StarSkyFinale({
  recipient,
  sender,
  wishTitle,
  finalBlessing,
  nightSkyImageUrl,
  onRestart,
}: StarSkyFinaleProps) {
  const [phase, setPhase] = useState<FinalePhase>("card");
  const [personalWish, setPersonalWish] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<FinalePhase>("card");
  const phaseStartRef = useRef<number>(0);

  useEffect(() => {
    phaseRef.current = phase;
    phaseStartRef.current = performance.now();
  }, [phase]);

  // Nhịp 1 -> Nhịp 2: Biến điều ước thành 1 ngôi sao quang học lơ lửng chờ người dùng chạm vào.
  const handleTransformToStar = () => {
    if (phase !== "card") return;
    soundEngine.playWishToStar();
    setPhase("morphing");
    window.setTimeout(() => {
      setPhase("starReady");
    }, 1450);
  };

  // Nhịp 2 -> Nhịp 3: Người dùng chạm vào ngôi sao -> Ngôi sao bay sâu vào bầu trời đêm.
  const handleTouchStar = () => {
    if (phase !== "starReady") return;
    soundEngine.playStarAscend();
    setPhase("flying");
    window.setTimeout(() => {
      setPhase("arrived");
    }, 3550);
  };

  // Vòng lặp dựng Ngôi Sao nhiễu xạ ống kính máy ảnh (Lens Diffraction Star) & Sao Chổi 60fps.
  useEffect(() => {
    if (phase === "card") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // 140 hạt bụi ánh kim hội tụ từ khung thiệp vào tâm tạo thành ngôi sao ước nguyện.
    const morphParticles: CosmicParticle[] = Array.from({ length: 140 }, (_, i) => {
      const angle = (i / 140) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 55 + Math.random() * Math.min(w, h) * 0.35;
      return {
        x: w * 0.5 + Math.cos(angle) * dist,
        y: h * 0.5 + Math.sin(angle) * dist * 0.68,
        vx: 0,
        vy: 0,
        size: 1.0 + Math.random() * 2.2,
        life: 0,
        maxLife: 1,
        hue: i % 6 === 0 ? "blue" : i % 2 === 0 ? "gold" : "ivory",
        orbitAngle: angle,
        orbitRadius: dist,
        orbitSpeed: 2.5 + Math.random() * 1.9,
      };
    });

    const trailParticles: CosmicParticle[] = [];
    const cometPathHistory: Array<{ x: number; y: number; scale: number }> = [];
    let shockwaveProgress = -1;

    // Hàm vẽ ngôi sao nhiễu xạ lá khẩu ống kính DSLR (6 tia mảnh sắc + quầng tán xạ khí quyển).
    const drawOpticalStar = (
      cx: number,
      cy: number,
      radius: number,
      intensity: number,
      rotRad: number
    ) => {
      if (intensity <= 0.005) return;

      // 1. Tán xạ khí quyển đêm quanh nhân sao (ấm ở trong, xanh khí quyển rất nhẹ ở rìa ngoài).
      const outerHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 5.6);
      outerHalo.addColorStop(0, `rgba(255, 252, 240, ${0.88 * intensity})`);
      outerHalo.addColorStop(0.16, `rgba(255, 220, 156, ${0.44 * intensity})`);
      outerHalo.addColorStop(0.48, `rgba(186, 204, 242, ${0.14 * intensity})`);
      outerHalo.addColorStop(1, "rgba(186, 204, 242, 0)");
      ctx.fillStyle = outerHalo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 5.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Sáu tia nhiễu xạ quang học sắc mảnh của lá khẩu máy ảnh phơi sáng đêm.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotRad);

      const spikeCount = 6;
      for (let i = 0; i < spikeCount; i++) {
        const isPrimary = i % 3 === 0 || i === 1;
        const spikeLen = radius * (isPrimary ? 4.8 : 2.9);
        const spikeWidth = Math.max(1.0, radius * 0.11);

        const grad = ctx.createLinearGradient(-spikeLen, 0, spikeLen, 0);
        grad.addColorStop(0, "rgba(255, 244, 214, 0)");
        grad.addColorStop(0.38, `rgba(255, 234, 188, ${0.40 * intensity})`);
        grad.addColorStop(0.5, `rgba(255, 255, 252, ${0.96 * intensity})`);
        grad.addColorStop(0.62, `rgba(255, 234, 188, ${0.40 * intensity})`);
        grad.addColorStop(1, "rgba(255, 244, 214, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, spikeLen, spikeWidth, (i * Math.PI) / spikeCount, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Điểm nhân trắng nóng rực như vì sao thật.
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.85);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      coreGrad.addColorStop(0.55, `rgba(255, 244, 206, ${0.9 * intensity})`);
      coreGrad.addColorStop(1, "rgba(255, 214, 140, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      ctx.clearRect(0, 0, w, h);

      const curPhase = phaseRef.current;
      const phaseElapsed = (now - phaseStartRef.current) / 1000;

      // Ngôi sao kết tinh ở giữa khung hình và bay thẳng vào tâm dải Ngân Hà thật (x=37%, y=23%).
      const startX = w * 0.5;
      const startY = h * 0.48;
      const destX = w * 0.37;
      const destY = h * 0.23;

      if (curPhase === "morphing") {
        const p = Math.min(1, phaseElapsed / 1.42);
        const easeInOut = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        for (const pt of morphParticles) {
          const curRadius = (pt.orbitRadius ?? 100) * Math.pow(1 - easeInOut, 1.45);
          const curAngle = (pt.orbitAngle ?? 0) + easeInOut * (pt.orbitSpeed ?? 3) * 2.4;
          const px = startX + Math.cos(curAngle) * curRadius;
          const py = startY + Math.sin(curAngle) * curRadius * 0.78;

          const alpha = Math.sin(Math.min(1, p * 1.35) * Math.PI * 0.85);
          const color =
            pt.hue === "gold"
              ? `rgba(255, 218, 142, ${alpha})`
              : pt.hue === "blue"
                ? `rgba(202, 222, 255, ${alpha})`
                : `rgba(255, 252, 242, ${alpha})`;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, pt.size * (1.2 - p * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }

        const starGrow = Math.max(0, (p - 0.24) / 0.76);
        drawOpticalStar(startX, startY, 10 + starGrow * 17, starGrow, now * 0.00022);
      } else if (curPhase === "starReady") {
        const floatY = startY + Math.sin(now * 0.0021) * 6.5;
        const pulse = 0.93 + 0.11 * Math.sin(now * 0.004);

        for (let i = 0; i < 22; i++) {
          const ang = (i / 22) * Math.PI * 2 + now * 0.0005 * (i % 2 === 0 ? 1 : -0.75);
          const rad = 32 + (i % 5) * 14 + Math.sin(now * 0.002 + i) * 4.5;
          const ox = startX + Math.cos(ang) * rad;
          const oy = floatY + Math.sin(ang) * rad * 0.62;
          const oa = 0.22 + 0.34 * Math.sin(now * 0.0038 + i * 1.7);
          ctx.fillStyle = `rgba(255, 236, 192, ${oa})`;
          ctx.beginPath();
          ctx.arc(ox, oy, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Gợn sóng ánh sáng mảnh mời người dùng chạm ngón tay vào ngôi sao.
        const ringCycle = (now * 0.00052) % 1;
        ctx.strokeStyle = `rgba(255, 236, 192, ${(1 - ringCycle) * 0.34})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(startX, floatY, 24 + ringCycle * 46, 0, Math.PI * 2);
        ctx.stroke();

        drawOpticalStar(startX, floatY, 26 * pulse, 1, now * 0.00022);
        shockwaveProgress = 0;
      } else if (curPhase === "flying" || curPhase === "arrived") {
        if (shockwaveProgress >= 0 && shockwaveProgress < 1) {
          shockwaveProgress = Math.min(1, shockwaveProgress + dt * 1.45);
          ctx.strokeStyle = `rgba(255, 246, 220, ${(1 - shockwaveProgress) * 0.62})`;
          ctx.lineWidth = 1.8 * (1 - shockwaveProgress);
          ctx.beginPath();
          ctx.arc(startX, startY, 18 + shockwaveProgress * 130, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (curPhase === "flying") {
          const flyDuration = 3.25;
          const rawT = Math.min(1, phaseElapsed / flyDuration);
          const easeT =
            rawT < 0.26
              ? 2.0 * rawT * rawT
              : 1 - Math.pow(1 - rawT, 2.6) * 0.865;
          const clampedT = Math.min(1, Math.max(0, easeT));

          // Đường bay vòng cung mềm mại từ tay người dùng vút lên dải Ngân Hà.
          const ctrlX = w * 0.66;
          const ctrlY = h * 0.30;
          const oneMinus = 1 - clampedT;
          const curX =
            oneMinus * oneMinus * startX +
            2 * oneMinus * clampedT * ctrlX +
            clampedT * clampedT * destX;
          const curY =
            oneMinus * oneMinus * startY +
            2 * oneMinus * clampedT * ctrlY +
            clampedT * clampedT * destY;

          const depthScale = 1 / (1 + clampedT * 4.4);

          cometPathHistory.push({ x: curX, y: curY, scale: depthScale });
          if (cometPathHistory.length > 38) cometPathHistory.shift();

          // Dải đuôi sao chổi gồm lớp khí xanh bạc mỏng bên ngoài và lõi bụi vàng trắng ở tâm.
          if (cometPathHistory.length > 2) {
            for (let i = 1; i < cometPathHistory.length; i++) {
              const prev = cometPathHistory[i - 1];
              const curr = cometPathHistory[i];
              const tailFrac = i / cometPathHistory.length;
              const fadeEnd = 1 - Math.pow(Math.max(0, (rawT - 0.78) / 0.22), 1.5);

              ctx.strokeStyle = `rgba(196, 218, 255, ${tailFrac * 0.28 * fadeEnd})`;
              ctx.lineWidth = Math.max(1.2, 18 * tailFrac * curr.scale);
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(curr.x, curr.y);
              ctx.stroke();

              ctx.strokeStyle = `rgba(255, 238, 192, ${tailFrac * 0.72 * fadeEnd})`;
              ctx.lineWidth = Math.max(0.7, 9.5 * tailFrac * curr.scale);
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(curr.x, curr.y);
              ctx.stroke();
            }
          }

          if (rawT < 0.92) {
            for (let k = 0; k < 3; k++) {
              trailParticles.push({
                x: curX + (Math.random() - 0.5) * 7 * depthScale,
                y: curY + (Math.random() - 0.5) * 7 * depthScale,
                vx: (Math.random() - 0.5) * 22,
                vy: (Math.random() - 0.3) * 20,
                size: (1.0 + Math.random() * 2.0) * Math.max(0.42, depthScale),
                life: 0,
                maxLife: 0.65 + Math.random() * 0.85,
                hue: k === 0 ? "gold" : "ivory",
              });
            }
          }

          const arrivalFlash =
            rawT > 0.84 ? Math.sin(((rawT - 0.84) / 0.16) * Math.PI) * 1.4 : 0;

          drawOpticalStar(
            curX,
            curY,
            Math.max(5.2, 26 * depthScale) + arrivalFlash * 13,
            1,
            now * 0.00055
          );
        } else {
          // Ngôi sao đã hòa vào dải Ngân Hà thật và lấp lánh dịu dàng trên bầu trời đêm.
          const gentleTwinkle = 0.8 + 0.2 * Math.sin(now * 0.0034);
          drawOpticalStar(destX, destY, 6.8 * gentleTwinkle, 0.96, 0.24);
        }

        for (let i = trailParticles.length - 1; i >= 0; i--) {
          const tp = trailParticles[i];
          tp.life += dt;
          if (tp.life >= tp.maxLife) {
            trailParticles.splice(i, 1);
            continue;
          }
          tp.x += tp.vx * dt;
          tp.y += tp.vy * dt;
          const a = (1 - tp.life / tp.maxLife) * 0.78;
          ctx.fillStyle =
            tp.hue === "gold"
              ? `rgba(255, 220, 146, ${a})`
              : `rgba(255, 252, 242, ${a})`;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [phase]);

  const showNightSky = phase !== "card";
  const skyPanUp = phase === "flying" || phase === "arrived";

  return (
    <div className="finale-cinema-wrapper">
      {/* Lớp 1: Ảnh chụp thật bầu trời đêm dải Ngân Hà bên hồ nước & rặng thông tĩnh lặng */}
      <div
        className={`real-night-sky-backdrop ${showNightSky ? "is-visible" : ""} ${skyPanUp ? "camera-pan-sky" : ""}`}
        style={{ backgroundImage: `url("${nightSkyImageUrl}")` }}
        aria-hidden="true"
      />

      {/* Lớp 2: Ảnh trường sao sâu vũ trụ (galaxy-deep.webp) hòa quyện khi máy quay ngước lên cao */}
      <div
        className={`real-deep-galaxy-layer ${skyPanUp ? "is-visible" : ""}`}
        style={{ backgroundImage: `url("${cardConfig.deepGalaxyImage}")` }}
        aria-hidden="true"
      />

      {/* Canvas toàn màn hình dựng Ngôi Sao quang học & Đuôi Sao Chổi bay vào vũ trụ */}
      {phase !== "card" && (
        <canvas ref={canvasRef} className="finale-star-canvas" aria-hidden="true" />
      )}

      {/* NHỊP 1: Tấm thiệp mỹ thuật đen dập nhũ vàng kim (Hot-Foil Stamped Card) */}
      {phase === "card" && (
        <div className="ornate-final-stage stage-fade-in">
          <div className="ornate-double-frame">
            <span
              className="ornate-card-grain"
              style={{ backgroundImage: `url("${cardConfig.kraftPaperImage}")` }}
              aria-hidden="true"
            />
            <span className="frame-corner corner-tl" aria-hidden="true" />
            <span className="frame-corner corner-tr" aria-hidden="true" />
            <span className="frame-corner corner-bl" aria-hidden="true" />
            <span className="frame-corner corner-br" aria-hidden="true" />

            <p className="ornate-top-label">DÀNH CHO {recipient.toUpperCase()}</p>
            <h1 className="ornate-main-greeting">
              Chúc Mừng Sinh Nhật, <em>{recipient}</em>
            </h1>
            <p className="ornate-from-label">TỪ {sender.toUpperCase()}</p>

            <p className="ornate-blessing-copy">{finalBlessing}</p>

            <div className="secret-wish-input-wrap">
              <input
                type="text"
                value={personalWish}
                onChange={(e) => setPersonalWish(e.target.value)}
                placeholder={`Viết thêm điều ước thầm kín của ${recipient} (tùy chọn)…`}
                className="secret-wish-input"
                maxLength={120}
              />
            </div>
          </div>

          <div className="ornate-actions">
            <button
              type="button"
              className="golden-amber-btn"
              onClick={handleTransformToStar}
            >
              Gửi điều ước lên trời <span aria-hidden="true">✦</span>
            </button>
            <button type="button" className="restart-underline-btn" onClick={onRestart}>
              Bắt đầu lại từ đầu
            </button>
          </div>
        </div>
      )}

      {/* NHỊP 2: Điều ước đã hóa thành 1 Ngôi Sao — Chờ người dùng chạm tay vào ngôi sao */}
      {phase === "starReady" && (
        <div className="star-touch-overlay stage-fade-in">
          <button
            type="button"
            className="interactive-star-hitbox"
            onClick={handleTouchStar}
            aria-label="Chạm vào ngôi sao để thả điều ước bay vào không gian bầu trời đêm"
          />

          <div className="star-touch-prompt">
            <p className="cinema-eyebrow">NGÔI SAO ƯỚC NGUYỆN • {wishTitle.toUpperCase()}</p>
            <h2 className="star-ready-title">
              Điều ước của <em>{recipient}</em> đã hóa thành một vì sao
            </h2>
            {personalWish.trim() && (
              <p className="personal-wish-whisper">“{personalWish.trim()}”</p>
            )}
            <p className="star-touch-instruction">
              ✦ Chạm nhẹ vào ngôi sao sáng để thả điều ước bay vào không gian bầu trời đêm…
            </p>
          </div>
        </div>
      )}

      {/* NHỊP 3: Lời kết tĩnh lặng dưới bầu trời dải Ngân Hà thật sau khi sao đã bay lên */}
      {phase === "arrived" && (
        <div className="sky-epilogue-panel stage-fade-in">
          <p className="cinema-eyebrow">ĐIỀU ƯỚC ĐÃ THUỘC VỀ BẦU TRỜI ĐÊM</p>
          <h2 className="sky-epilogue-title">
            Vì sao của <em>{recipient}</em> đang lấp lánh trên cao
          </h2>
          <p className="sky-epilogue-copy">
            Mỗi khi ngước nhìn bầu trời đêm, hãy nhớ rằng luôn có những điều ấm áp nhất đang hướng về cậu. Chúc mừng sinh nhật nhé!
          </p>
          <button type="button" className="cinema-pill-btn" onClick={onRestart}>
            Xem lại tấm thiệp từ đầu <span aria-hidden="true">↺</span>
          </button>
        </div>
      )}
    </div>
  );
}
