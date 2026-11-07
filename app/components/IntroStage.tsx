"use client";

import { useEffect, useRef, useState } from "react";
import { cardConfig } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// TRANG MỞ ĐẦU PHONG CÁCH HARRY POTTER & ẤN SÁP VÀNG 24K MỆNH KIM (IntroStage.tsx)
// Xuất hiện đầu tiên khi mở đường dẫn thiệp để kích hoạt nhạc nền tự nhiên nhất:
// - Hậu cảnh là ảnh chụp thật từ máy ảnh DSLR bàn gỗ thư pháp cổ (hogwarts-desk-gold.jpg)
//   với ngòi bút đồng, cán dấu gỗ và lò nung sáp vàng 24K dưới ánh nến trầm mặc.
// - Ngọn nến sáp thật chụp Macro DSLR (flame-macro.jpg) cháy lung linh ở góc bàn,
//   hắt ánh lửa vàng ấm 2200K lên phong bì giấy da dê cổ ở trung tâm.
// - Tâm điểm là phong bì cổ niêm phong Ấn Sáp Vàng Hoàng Kim 3D (gold-wax-envelope.jpg)
//   có chữ mực bút lông ngỗng thấm trực tiếp vào thớ giấy.
// - Khoảnh khắc người nhận chạm vào ấn sáp vàng: nhạc nền lập tức ngân vang cùng tiếng
//   chuông Celesta phép màu, bụi vàng 24K bung tỏa từ con dấu sáp rồi máy quay tiến vào
//   Vòng Xoay Bánh Xe Ngày Sinh (DateWheelStage).
// ============================================================================

interface IntroStageProps {
  recipient: string;
  sender: string;
  onUnlockAudio: () => void;
  onComplete: () => void;
}

interface GoldenEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  isBokeh: boolean;
}

interface SealBurstSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  tone: "gold" | "champagne" | "ivory";
}

export default function IntroStage({
  recipient,
  sender,
  onUnlockAudio,
  onComplete,
}: IntroStageProps) {
  const [isOpening, setIsOpening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envelopeBtnRef = useRef<HTMLButtonElement>(null);
  const sealAnchorRef = useRef<HTMLSpanElement>(null);

  const openingRef = useRef(false);
  const openStartRef = useRef(0);
  const sealOriginRef = useRef<{ x: number; y: number } | null>(null);
  const burstSparksRef = useRef<SealBurstSpark[]>([]);

  // Vòng lặp 60fps dựng bụi lửa nến lơ lửng kiểu đại sảnh đường Hogwarts
  // và hiệu ứng bung hạt nhũ vàng 24K khi người nhận chạm vỡ ấn sáp mở thư.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Khởi tạo các hạt bụi phép màu ánh kim bay lơ lửng chậm rãi trong ánh nến.
    const embers: GoldenEmber[] = Array.from({ length: 38 }, (_, i) => {
      const isBokeh = i % 4 === 0;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.16 - Math.random() * 0.36,
        radius: isBokeh ? 7 + Math.random() * 14 : 0.9 + Math.random() * 2.1,
        alpha: isBokeh ? 0.05 + Math.random() * 0.06 : 0.22 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        isBokeh,
      };
    });

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      // 1. Vẽ các đốm tàn nến & hạt bụi vàng lơ lửng theo trường ảnh nông 50mm f/1.4.
      for (const e of embers) {
        e.x += e.vx + Math.sin(now * 0.0008 + e.phase) * 0.14;
        e.y += e.vy;

        if (e.y < -30) {
          e.y = height + 24;
          e.x = Math.random() * width;
        }
        if (e.x < -30) e.x = width + 30;
        if (e.x > width + 30) e.x = -30;

        const flicker = 0.62 + 0.38 * Math.sin(now * 0.0028 + e.phase);
        const a = e.alpha * flicker;

        if (e.isBokeh) {
          const grad = ctx.createRadialGradient(e.x, e.y, e.radius * 0.1, e.x, e.y, e.radius);
          grad.addColorStop(0, `rgba(255, 224, 142, ${a * 0.55})`);
          grad.addColorStop(0.8, `rgba(238, 184, 78, ${a * 0.9})`);
          grad.addColorStop(1, "rgba(238, 184, 78, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * 2.8);
          grad.addColorStop(0, `rgba(255, 248, 214, ${a})`);
          grad.addColorStop(0.45, `rgba(244, 196, 88, ${a * 0.55})`);
          grad.addColorStop(1, "rgba(244, 196, 88, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Khi người nhận chạm vào ấn sáp vàng: vẽ quầng sáng phép màu & 95 hạt nhũ vàng 24K bung tỏa.
      if (openingRef.current && sealOriginRef.current) {
        const elapsed = (now - openStartRef.current) / 1000;
        const p = Math.min(1, elapsed / 1.18);
        const { x: sx, y: sy } = sealOriginRef.current;

        // Sóng ánh sáng tròn lan ra từ tâm ấn sáp vàng.
        const ringAlpha = Math.max(0, (1 - p) * 0.58);
        ctx.strokeStyle = `rgba(255, 236, 168, ${ringAlpha})`;
        ctx.lineWidth = 1.8 * (1 - p * 0.6);
        ctx.beginPath();
        ctx.arc(sx, sy, 22 + p * 190, 0, Math.PI * 2);
        ctx.stroke();

        // Hào quang thấu kính ấm mở rộng dẫn máy quay vào bánh xe ngày sinh.
        const bloomR = 60 + p * Math.max(width, height) * 0.52;
        const bloomAlpha = Math.sin(p * Math.PI) * 0.42;
        const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomR);
        bloom.addColorStop(0, `rgba(255, 250, 224, ${bloomAlpha * 1.15})`);
        bloom.addColorStop(0.32, `rgba(244, 194, 88, ${bloomAlpha * 0.68})`);
        bloom.addColorStop(1, "rgba(214, 148, 42, 0)");
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
        ctx.fill();

        const sparks = burstSparksRef.current;
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.life += dt;
          if (sp.life >= sp.maxLife) {
            sparks.splice(i, 1);
            continue;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vx *= 0.975;
          sp.vy = sp.vy * 0.975 - 18 * dt; // Bụi phép màu nhẹ nhàng bay vút lên cao

          const lifeRatio = 1 - sp.life / sp.maxLife;
          const color =
            sp.tone === "gold"
              ? `rgba(255, 208, 92, ${lifeRatio})`
              : sp.tone === "champagne"
                ? `rgba(255, 234, 162, ${lifeRatio})`
                : `rgba(255, 252, 238, ${lifeRatio})`;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * (0.5 + 0.5 * lifeRatio), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Nghiêng nhẹ phong bì giấy 3D và dịch chuyển ánh phản quang sáp vàng theo góc nhìn chuột/ngón tay.
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (openingRef.current || !envelopeBtnRef.current) return;
    const rect = envelopeBtnRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    envelopeBtnRef.current.style.setProperty("--env-rx", `${(-ny * 6.5).toFixed(2)}deg`);
    envelopeBtnRef.current.style.setProperty("--env-ry", `${(nx * 8.0).toFixed(2)}deg`);
    envelopeBtnRef.current.style.setProperty("--glare-x", `${(50 + nx * 38).toFixed(1)}%`);
    envelopeBtnRef.current.style.setProperty("--glare-y", `${(46 + ny * 38).toFixed(1)}%`);
  };

  const handlePointerLeave = () => {
    if (!envelopeBtnRef.current) return;
    envelopeBtnRef.current.style.setProperty("--env-rx", "0deg");
    envelopeBtnRef.current.style.setProperty("--env-ry", "0deg");
    envelopeBtnRef.current.style.setProperty("--glare-x", "50%");
    envelopeBtnRef.current.style.setProperty("--glare-y", "46%");
  };

  // Xử lý khoảnh khắc người nhận chạm tay mở Ấn Sáp Vàng:
  // 1. Mở khóa trình duyệt & phát nhạc nền ngay lập tức trong cùng sự kiện chạm.
  // 2. Ngân vang chuông Celesta phép màu + tiếng sột soạt mở phong thư cổ.
  // 3. Bung 95 hạt nhũ vàng 24K từ ấn sáp và đẩy máy quay vào màn Vòng Xoay Ngày Sinh.
  const handleOpenLetter = () => {
    if (openingRef.current) return;
    openingRef.current = true;
    openStartRef.current = performance.now();
    setIsOpening(true);

    // Phát nhạc nền ngay lập tức khi người nhận chạm mở thiệp.
    onUnlockAudio();
    soundEngine.playHogwartsSealOpen();

    // Xác định tâm vật lý của con dấu sáp vàng 24K trên màn hình để phóng hạt bụi phép màu.
    let cx = window.innerWidth * 0.5;
    let cy = window.innerHeight * 0.48;
    if (sealAnchorRef.current) {
      const r = sealAnchorRef.current.getBoundingClientRect();
      cx = r.left + r.width * 0.5;
      cy = r.top + r.height * 0.5;
    }
    sealOriginRef.current = { x: cx, y: cy };

    const tones: Array<SealBurstSpark["tone"]> = ["gold", "champagne", "ivory"];
    burstSparksRef.current = Array.from({ length: 95 }, (_, i) => {
      const angle = (i / 95) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 38 + Math.random() * 165;
      return {
        x: cx + (Math.random() - 0.5) * 14,
        y: cy + (Math.random() - 0.5) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.85 - 22,
        size: 1.2 + Math.random() * 2.6,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.6,
        tone: tones[i % 3],
      };
    });

    window.setTimeout(() => {
      onComplete();
    }, 1180);
  };

  return (
    <div className={`intro-hogwarts-stage ${isOpening ? "is-opening" : "stage-fade-in"}`}>
      {/* Lớp 1: Ảnh chụp thật bàn gỗ thư pháp cổ, ngòi bút đồng & lò nung sáp vàng 24K dưới ánh nến */}
      <div
        className="hogwarts-study-backdrop"
        style={{ backgroundImage: `url("${cardConfig.hogwartsDeskImage}")` }}
        aria-hidden="true"
      />

      {/* Lớp 2: Ngọn nến sáp thật chụp Macro DSLR cháy bập bùng ở góc trái bàn đọc sách */}
      <div
        className="hogwarts-live-candle"
        style={{ backgroundImage: `url("${cardConfig.candleFlameMacroImage}")` }}
        aria-hidden="true"
      />

      {/* Ánh lửa nến 2200K bập bùng hắt ấm lên mặt bàn gỗ và bức mật thư */}
      <div className="hogwarts-candlelight-wash" aria-hidden="true" />

      {/* Lớp 3: Canvas 60fps dựng tàn nến bay lơ lửng & nhũ vàng 24K bung tỏa khi mở ấn sáp */}
      <canvas ref={canvasRef} className="hogwarts-magic-canvas" aria-hidden="true" />

      {/* Cụm tiêu đề điện ảnh dẫn nhập phía trên bức mật thư */}
      <div className="intro-header-copy">
        <p className="cinema-eyebrow">✦ MẬT THƯ ẤN SÁP HOÀNG KIM • TỪ {sender.toUpperCase()} ✦</p>
        <h1 className="cinema-serif-title">
          Một lá thư phép màu gửi <em>{recipient}</em>
        </h1>
      </div>

      {/* Lớp 4: Phong bì giấy da dê cổ chụp thật với Ấn Sáp Vàng 24K nổi khối 3D ở trung tâm */}
      <button
        ref={envelopeBtnRef}
        type="button"
        className={`hogwarts-envelope-button ${isOpening ? "is-unsealing" : ""}`}
        onClick={handleOpenLetter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label={`Chạm vào ấn sáp vàng để mở thiệp sinh nhật gửi ${recipient} và bật nhạc`}
      >
        {/* Bề mặt phong bì giấy da dê & con dấu sáp vàng 24K chụp thật */}
        <span className="hogwarts-envelope-surface" aria-hidden="true">
          <span
            className="hogwarts-envelope-photo"
            style={{ backgroundImage: `url("${cardConfig.waxEnvelopeImage}")` }}
          />
          {/* Ánh đèn nến vàng ấm chiếu tập trung và phản quang kim loại nhẹ trên mặt sáp vàng */}
          <span className="hogwarts-envelope-chiaroscuro" />
        </span>

        {/* Dòng bưu ấn mực nâu cổ thấm vào mép trên nắp phong bì */}
        <span className="hogwarts-ink-flap" aria-hidden="true">
          NIÊM PHONG HOÀNG KIM • ĐÊM SINH NHẬT
        </span>

        {/* Vòng hào quang nhịp thở mảnh bao quanh đúng vị trí Ấn Sáp Vàng 24K thật */}
        <span ref={sealAnchorRef} className="hogwarts-wax-seal-halo" aria-hidden="true">
          <span className="seal-pulse-ring" />
          <span className="seal-pulse-ring delay" />
        </span>

        {/* Chữ bút mực lông ngỗng thấm trực tiếp lên thớ giấy kem bên dưới Ấn Sáp Vàng */}
        <span className="hogwarts-ink-address">
          <span className="hogwarts-ink-salutation">Kính gửi {recipient},</span>
          <span className="hogwarts-ink-whisper">
            Lời chúc tuổi mới đã được niêm phong dưới ánh nến vàng dành riêng cho cậu…
          </span>
        </span>
      </button>

      {/* Dòng phụ đề điện ảnh 35mm không khung viền hộp giả dưới bức mật thư */}
      <div className="hogwarts-open-cue">
        <button
          type="button"
          className="cinema-pill-btn golden-glow hogwarts-cta-pill"
          onClick={handleOpenLetter}
        >
          <span className="hogwarts-cta-spark" aria-hidden="true">
            ✦
          </span>
          <span>Chạm mở ấn sáp vàng &amp; bật giai điệu sinh nhật</span>
          <span className="hogwarts-cta-spark" aria-hidden="true">
            ✦
          </span>
        </button>
      </div>
    </div>
  );
}
