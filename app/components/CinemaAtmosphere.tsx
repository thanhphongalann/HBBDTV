"use client";

import { useEffect, useRef } from "react";

// ============================================================================
// LỚP KHÔNG GIAN ỐNG KÍNH MÁY ẢNH DSLR, BOKEH VÀNG KIM & CÁNH HOA HOÀNG KIM 3 TẦNG TIÊU CỰ
// (CinemaAtmosphere.tsx)
// Tái tạo cảm giác đang xem thước phim quay thật từ máy ảnh ống kính 50mm f/1.4
// phối riêng tông Vàng Hoàng Kim - Sâm Panh - Bạch Kim cho người nhận Mệnh Kim:
// - Lớp ảnh chụp thật các vòng tròn bokeh vàng ấm lơ lửng phía xa với nhịp máy thở nhẹ.
// - Ở cảnh Bánh Kem phòng tối (darkroomMode), phông nền tự động hạ tối sâu như tắt đèn phòng
//   để chiếc bánh kem chụp thật hòa quyện 100% không một gợn viền.
// - Các cánh hoa hồng vàng sâm panh & lá nhũ vàng 24K được dựng thành 3 tầng trường ảnh
//   (tiền cảnh mờ bokeh sát ống kính, trung cảnh sắc nét thấy gân cánh hoa ánh kim, hậu cảnh mờ xa).
// ============================================================================

interface CinemaAtmosphereProps {
  enablePetals: boolean;
  darkroomMode?: boolean;
  subtleMode?: boolean;
  bokehPhotoUrl: string;
}

interface OpticalBokehDust {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  isApertureRing: boolean;
}

interface DepthRosePetal {
  x: number;
  y: number;
  size: number;
  dofLayer: 0 | 1 | 2; // 0: hậu cảnh mờ nhẹ, 1: đúng nét tiêu cự, 2: tiền cảnh sát ống kính mờ mạnh
  vy: number;
  swayAmp: number;
  swaySpeed: number;
  phase: number;
  rotation: number;
  rotSpeed: number;
  flipPhase: number;
  flipSpeed: number;
}

// Hàm tạo trước 3 tấm Sprite cánh hoa Hoàng Kim / Vàng Sâm Panh ở 3 mức lấy nét ống kính (DOF)
// hợp phong thủy Mệnh Kim (tuyệt đối không dùng sắc hồng).
function buildOpticalPetalSprites(): HTMLCanvasElement[] {
  const blurLevels = [2.2, 0, 6.4]; // px độ nhòe quang học cho Hậu cảnh, Trung cảnh, Tiền cảnh
  return blurLevels.map((blurPx, idx) => {
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 96;
    const g = c.getContext("2d");
    if (!g) return c;

    g.save();
    if (blurPx > 0) {
      g.filter = `blur(${blurPx}px)`;
    }
    g.translate(48, 48);

    // Hình dáng cánh hoa trà / hồng vàng thật hơi khum lòng thuyền và có khía mềm ở đầu cánh.
    const r = 24;
    g.beginPath();
    g.moveTo(0, -r * 0.82);
    g.bezierCurveTo(r * 0.45, -r * 1.05, r * 1.12, -r * 0.38, r * 0.86, r * 0.36);
    g.bezierCurveTo(r * 0.62, r * 0.88, r * 0.18, r * 1.04, 0, r * 0.98);
    g.bezierCurveTo(-r * 0.18, r * 1.04, -r * 0.62, r * 0.88, -r * 0.86, r * 0.36);
    g.bezierCurveTo(-r * 1.12, -r * 0.38, -r * 0.45, -r * 1.05, 0, -r * 0.82);
    g.closePath();

    // Chuyển sắc Cánh Hoa Vàng Sâm Panh & Nhũ Hoàng Kim 24K dưới ánh nến ấm (chuẩn Mệnh Kim).
    const grad = g.createRadialGradient(-r * 0.22, -r * 0.25, r * 0.1, 0, r * 0.1, r * 1.18);
    if (idx === 1) {
      grad.addColorStop(0, "rgba(255, 250, 228, 0.96)");
      grad.addColorStop(0.46, "rgba(238, 196, 104, 0.94)");
      grad.addColorStop(0.84, "rgba(182, 128, 42, 0.92)");
      grad.addColorStop(1, "rgba(122, 80, 22, 0.88)");
    } else {
      grad.addColorStop(0, "rgba(255, 244, 212, 0.86)");
      grad.addColorStop(0.6, "rgba(224, 176, 84, 0.78)");
      grad.addColorStop(1, "rgba(154, 104, 32, 0.68)");
    }
    g.fillStyle = grad;
    g.fill();

    // Với cánh hoa nằm đúng mặt phẳng lấy nét (idx === 1), vẽ thêm gân ánh kim & viền bắt sáng vàng 24K.
    if (idx === 1) {
      g.strokeStyle = "rgba(255, 246, 206, 0.42)";
      g.lineWidth = 0.9;
      g.stroke();

      g.strokeStyle = "rgba(146, 98, 28, 0.32)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(0, r * 0.9);
      g.quadraticCurveTo(r * 0.06, 0, 0, -r * 0.68);
      g.stroke();
    }

    g.restore();
    return c;
  });
}

export default function CinemaAtmosphere({
  enablePetals,
  darkroomMode = false,
  subtleMode = false,
  bokehPhotoUrl,
}: CinemaAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsEnabledRef = useRef(enablePetals);
  const darkroomRef = useRef(darkroomMode);
  const subtleRef = useRef(subtleMode);

  useEffect(() => {
    petalsEnabledRef.current = enablePetals;
    darkroomRef.current = darkroomMode;
    subtleRef.current = subtleMode;
  }, [enablePetals, darkroomMode, subtleMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId = 0;

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

    const petalSprites = buildOpticalPetalSprites();

    // Khởi tạo các đốm bokeh khẩu độ tròn (có viền sáng mỏng đặc trưng của thấu kính 50mm thật).
    const dusts: OpticalBokehDust[] = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: i % 5 === 0 ? 9 + Math.random() * 14 : 1.4 + Math.random() * 4.2,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -0.06 - Math.random() * 0.18,
      alpha: i % 5 === 0 ? 0.045 + Math.random() * 0.05 : 0.08 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      isApertureRing: i % 5 === 0,
    }));

    const createPetal = (randomY = false): DepthRosePetal => {
      const roll = Math.random();
      const dofLayer: 0 | 1 | 2 = roll < 0.35 ? 0 : roll < 0.82 ? 1 : 2;
      const baseSize = dofLayer === 0 ? 16 : dofLayer === 1 ? 24 : 44;
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : -60 - Math.random() * 160,
        size: baseSize + Math.random() * 10,
        dofLayer,
        vy: dofLayer === 0 ? 0.42 + Math.random() * 0.28 : dofLayer === 1 ? 0.68 + Math.random() * 0.42 : 1.15 + Math.random() * 0.55,
        swayAmp: 0.32 + Math.random() * 0.65,
        swaySpeed: 0.007 + Math.random() * 0.011,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.016,
        flipPhase: Math.random() * Math.PI * 2,
        flipSpeed: 0.014 + Math.random() * 0.02,
      };
    };

    const petals: DepthRosePetal[] = Array.from({ length: 18 }, () => createPetal(true));
    let petalOpacityMaster = petalsEnabledRef.current ? 1 : 0;
    let dustMaster = darkroomRef.current ? 0.14 : 1;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const targetPetalAlpha = petalsEnabledRef.current ? 1 : 0;
      petalOpacityMaster += (targetPetalAlpha - petalOpacityMaster) * 0.04;

      const targetDust = darkroomRef.current ? 0.12 : subtleRef.current ? 0.28 : 1;
      dustMaster += (targetDust - dustMaster) * 0.05;

      // 1. Vẽ các đĩa bokeh khẩu độ vàng ấm thật (warm tungsten 2700K, không dùng màu tím giả).
      for (const d of dusts) {
        d.x += d.vx + Math.sin(time * 0.0005 + d.phase) * 0.07;
        d.y += d.vy;
        if (d.y < -30) {
          d.y = height + 30;
          d.x = Math.random() * width;
        }
        if (d.x < -30) d.x = width + 30;
        if (d.x > width + 30) d.x = -30;

        const twinkle = 0.68 + 0.32 * Math.sin(time * 0.0016 + d.phase);
        const a = d.alpha * twinkle * dustMaster;
        if (a <= 0.004) continue;

        if (d.isApertureRing) {
          // Đĩa bokeh khẩu độ thật có phần rìa sáng nhẹ hơn phần tâm.
          const grad = ctx.createRadialGradient(d.x, d.y, d.radius * 0.15, d.x, d.y, d.radius);
          grad.addColorStop(0, `rgba(255, 214, 152, ${a * 0.55})`);
          grad.addColorStop(0.78, `rgba(255, 198, 126, ${a * 0.92})`);
          grad.addColorStop(0.94, `rgba(255, 224, 168, ${a})`);
          grad.addColorStop(1, "rgba(255, 198, 126, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius * 2.4);
          grad.addColorStop(0, `rgba(255, 236, 196, ${a})`);
          grad.addColorStop(0.45, `rgba(238, 182, 118, ${a * 0.42})`);
          grad.addColorStop(1, "rgba(238, 182, 118, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Vẽ các cánh hoa hồng nhung theo 3 lớp tiêu cự ống kính máy ảnh.
      if (petalOpacityMaster > 0.01) {
        for (const p of petals) {
          p.phase += p.swaySpeed;
          p.flipPhase += p.flipSpeed;
          p.rotation += p.rotSpeed;
          p.x += Math.sin(p.phase) * p.swayAmp;
          p.y += p.vy;

          if (p.y > height + 70) {
            Object.assign(p, createPetal(false));
          }

          const flipScale = 0.34 + 0.66 * Math.abs(Math.cos(p.flipPhase));
          const layerAlpha = p.dofLayer === 0 ? 0.48 : p.dofLayer === 1 ? 0.88 : 0.42;
          const sprite = petalSprites[p.dofLayer];

          ctx.save();
          ctx.globalAlpha = petalOpacityMaster * layerAlpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.scale(1, flipScale);
          ctx.drawImage(sprite, -p.size, -p.size, p.size * 2, p.size * 2);
          ctx.restore();
        }
      }

      animationId = window.requestAnimationFrame(render);
    };

    animationId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Lớp ảnh chụp thật vòng tròn bokeh từ ống kính 50mm f/1.4 chuyển động cực êm */}
      <div
        className={`cinema-bokeh-photo-layer ${darkroomMode ? "is-darkroom" : ""} ${subtleMode ? "is-subtle" : ""}`}
        style={{ backgroundImage: `url("${bokehPhotoUrl}")` }}
        aria-hidden="true"
      />
      {/* Canvas 60fps dựng hạt sáng khẩu độ và cánh hoa hồng 3 tầng tiêu cự */}
      <canvas ref={canvasRef} className="cinema-particle-canvas" aria-hidden="true" />
      {/* Lớp tối viền thấu kính (Optical Vignette) và hạt phim 35mm tự nhiên */}
      <div className="camera-vignette-overlay" aria-hidden="true" />
      <div className="camera-film-grain" aria-hidden="true" />
    </>
  );
}
