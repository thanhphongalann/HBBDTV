"use client";

import { useEffect, useRef, useState } from "react";
import { cardConfig } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// MÀN HÌNH BÁNH KEM CHỤP THẬT TỪ MÁY ẢNH DSLR & THẮP NẾN 3 GIÂY (RealisticCakeStage.tsx)
// Thay thế hoàn toàn mô hình 3D giả lập bằng hệ thống tái chiếu sáng ảnh chụp thật
// đa lớp (Multi-Layer DSLR Photographic Relighting) trên WebGL2 ở tốc độ 60–120fps:
// - Lớp 1 (cake-unlit.jpg)    : Ảnh chụp thật chiếc bánh kem dâu tây kem tươi & 6 cây nến xoắn
//                               trong phòng tối dịu khi chưa châm lửa.
// - Lớp 2 (cake-body-lit.jpg) : Ảnh chụp thật chính chiếc bánh đó khi rực sáng ánh lửa ấm 2200K,
//                               tái tạo độ tán xạ sáp nến, bóng đổ thật trên kem tươi và dâu mọng.
// - Lớp 3 (cake-flames.jpg)   : Atlas 2 ngọn lửa nến chụp thật bằng ống kính DSLR có chân lửa xanh
//                               oxy, tim bấc sợi bông đỏ hồng và quầng tán xạ thấu kính tự nhiên.
// - Khi người nhận NHẤN GIỮ vào bánh kem trong 3 giây:
//   Tim bấc nến ửng đỏ -> 6 ngọn lửa thật bắt sáng rồi lớn dần mượt mà đến độ cháy rực rỡ nhất,
//   ánh nến vàng ấm lan tỏa & rung rinh sống động trên từng quả dâu, múi kem như video quay thật.
// ============================================================================

interface RealisticCakeStageProps {
  onComplete: () => void;
}

// Tọa độ chuẩn hóa UV (0..1) của 6 đầu bấc nến trên khung ảnh DSLR 1360x1200:
// - u, v       : Điểm neo chân ngọn lửa ngay đầu tim bấc nến.
// - widthUV    : Độ rộng chuẩn của ngọn lửa khi cháy cực đại (tính theo tỷ lệ khung hình).
// - heightUV   : Chiều cao ngọn lửa khi cháy cực đại (sau 3.0 giây nhấn giữ).
// - leanRad    : Độ nghiêng tự nhiên rất nhẹ của từng ngọn lửa giống ảnh chụp gốc.
// - spriteIdx  : Chọn mẫu ngọn lửa DSLR thật số 0 hoặc số 1 trong atlas để đa dạng hình dáng.
// - igniteAt   : Độ trễ bén lửa siêu nhỏ (0.00 -> 0.08) để 6 ngọn nến bắt sáng tự nhiên liên tiếp.
// - phase      : Pha dao động gió riêng biệt để 6 ngọn lửa không bao giờ lay động trùng lặp nhau.
const CANDLE_WICKS = [
  { u: 0.3037, v: 0.3475, widthUV: 0.058, heightUV: 0.092, leanRad: -0.02, spriteIdx: 0, igniteAt: 0.01, phase: 0.4 },
  { u: 0.4228, v: 0.3125, widthUV: 0.066, heightUV: 0.112, leanRad: 0.06,  spriteIdx: 1, igniteAt: 0.03, phase: 1.9 },
  { u: 0.4632, v: 0.4308, widthUV: 0.066, heightUV: 0.115, leanRad: 0.12,  spriteIdx: 1, igniteAt: 0.00, phase: 3.3 },
  { u: 0.5441, v: 0.3458, widthUV: 0.068, heightUV: 0.118, leanRad: 0.01,  spriteIdx: 0, igniteAt: 0.02, phase: 4.7 },
  { u: 0.6640, v: 0.3425, widthUV: 0.056, heightUV: 0.090, leanRad: -0.03, spriteIdx: 0, igniteAt: 0.05, phase: 2.6 },
  { u: 0.7000, v: 0.3783, widthUV: 0.058, heightUV: 0.096, leanRad: -0.18, spriteIdx: 1, igniteAt: 0.07, phase: 5.5 },
] as const;

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  isSmoke?: boolean;
}

// Vertex Shader trải phẳng khung hình sang tọa độ ảnh chuẩn (0,0 ở góc trên trái).
const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
  // Đảo trục Y để vUv = (0,0) nằm ở góc trên bên trái khớp trực tiếp với ảnh chụp DSLR.
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment Shader kết hợp tái chiếu sáng ảnh bánh DSLR + biến dạng gió mượt trên 6 ngọn lửa thật.
const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uUnlitTex;   // Ảnh chụp bánh kem phòng tối khi chưa đốt nến
uniform sampler2D uLitBodyTex; // Ảnh chụp thân bánh kem rực sáng dưới ánh nến 2200K
uniform sampler2D uFlamesTex;  // Atlas 2 ngọn lửa nến chụp thật bằng máy ảnh DSLR

uniform float uTime;
uniform float uProgress;       // Tiến trình nhấn giữ 0.0 -> 1.0 (đạt 1.0 ở đúng 3.0 giây)
uniform float uIsHolding;      // 1.0 khi ngón tay/chuột đang nhấn giữ
uniform float uPeakGlow;       // Chớp hào quang ấm khi nến bùng cháy lớn nhất ở giây thứ 3
uniform float uDissolve;       // Độ tan mờ êm ái khi chuyển sang màn Tâm sự

// Mảng hằng số 6 cây nến truyền trực tiếp vào GPU để dựng đồng thời 6 ngọn lửa thật.
const vec2 WICK_POS[6] = vec2[6](
  vec2(0.3037, 0.3475),
  vec2(0.4228, 0.3125),
  vec2(0.4632, 0.4308),
  vec2(0.5441, 0.3458),
  vec2(0.6640, 0.3425),
  vec2(0.7000, 0.3783)
);

const vec2 FLAME_SIZE[6] = vec2[6](
  vec2(0.058, 0.092),
  vec2(0.066, 0.112),
  vec2(0.066, 0.115),
  vec2(0.068, 0.118),
  vec2(0.056, 0.090),
  vec2(0.058, 0.096)
);

const float FLAME_LEAN[6] = float[6](-0.02, 0.06, 0.12, 0.01, -0.03, -0.18);
const float FLAME_SPRITE[6] = float[6](0.0, 1.0, 1.0, 0.0, 0.0, 1.0);
const float IGNITE_OFFSET[6] = float[6](0.01, 0.03, 0.00, 0.02, 0.05, 0.07);
const float FLAME_PHASE[6] = float[6](0.4, 1.9, 3.3, 4.7, 2.6, 5.5);

void main() {
  // Tỷ lệ khung hình gốc của ảnh bánh DSLR (1360 / 1200 = 1.1333).
  const float aspect = 1.133333;

  // Mô phỏng nhịp thở siêu nhẹ của máy quay cầm tay (Handheld 50mm f/1.4 Cinema Camera)
  // kèm hiệu ứng tiến máy rất êm (push-in) khi người nhận đang nhấn giữ thắp nến.
  float camZoom = 1.0 + uProgress * 0.028 + uPeakGlow * 0.012;
  vec2 camDrift = vec2(
    sin(uTime * 0.68) * 0.0020 + cos(uTime * 1.15) * 0.0008,
    cos(uTime * 0.54) * 0.0018 + sin(uTime * 0.95) * 0.0007
  );
  vec2 uv = (vUv - vec2(0.5, 0.54)) / camZoom + vec2(0.5, 0.54) + camDrift;

  // Mặt nạ biên elip siêu mềm để rìa ảnh hòa tan 100% vào nền phòng tối, tuyệt đối không có viền khung!
  vec2 edgeDelta = (uv - vec2(0.5, 0.53)) * vec2(1.0, 1.06);
  float edgeAlpha = 1.0 - smoothstep(0.37, 0.495, length(edgeDelta));
  if (edgeAlpha <= 0.001) {
    fragColor = vec4(0.0);
    return;
  }

  // Đọc màu sắc từ 2 tấm ảnh chụp thật (chưa thắp nến & đã rực sáng ánh nến).
  vec3 unlitCol = texture(uUnlitTex, uv).rgb;
  vec3 litCol = texture(uLitBodyTex, uv).rgb;

  // Tính trường ánh sáng nến lan tỏa ra từ cả 6 đầu bấc theo thời gian thực:
  // Khi uProgress tăng từ 0 -> 1 trong 3 giây, vùng sáng vàng ấm mở rộng từ đầu nến xuống dâu tây & kem tươi.
  float totalLightField = 0.0;
  vec3 emberAndAirGlow = vec3(0.0);
  vec3 combinedFlames = vec3(0.0);

  // Nhịp gợi ý rất khẽ trên đầu bấc khi người dùng chưa chạm tay vào bánh.
  float idleSparkle = (1.0 - step(0.005, uProgress)) * (1.0 - uIsHolding);

  for (int i = 0; i < 6; i++) {
    vec2 wick = WICK_POS[i];
    float ph = FLAME_PHASE[i];

    // Mức độ cháy riêng của từng cây nến từ 0.0 -> 1.0 (chuẩn hóa mượt sau điểm bén lửa).
    float localP = clamp((uProgress - IGNITE_OFFSET[i]) / (1.0 - IGNITE_OFFSET[i]), 0.0, 1.0);

    // Độ rung rinh tự nhiên của ngọn nến (kết hợp nhiều tần số sóng nhiệt thực tế).
    float flicker = 1.0
      + 0.055 * sin(uTime * 9.4 + ph)
      + 0.035 * sin(uTime * 16.8 + ph * 2.1)
      + 0.022 * cos(uTime * 25.3 + ph * 0.7);

    // Khoảng cách vật lý từ điểm ảnh hiện tại tới đầu bấc thứ i.
    vec2 dWick = vec2((uv.x - wick.x) * aspect, uv.y - wick.y);
    float dist = length(dWick);

    // 1. Gợi ý đốm sáng ấm siêu mảnh ngay đầu tim bấc trước khi nhấn giữ (thay cho nút tròn giả!).
    if (idleSparkle > 0.01) {
      float pulse = 0.45 + 0.55 * sin(uTime * 2.6 + ph * 0.9);
      float hintDot = exp(-dist * dist / (2.0 * 0.0065 * 0.0065)) * pulse * idleSparkle;
      emberAndAirGlow += vec3(1.0, 0.72, 0.38) * hintDot * 0.38;
    }

    // 2. Khi bắt đầu nhấn giữ: đốm than hồng đỏ cam rực lên ngay đầu tim bấc sợi bông.
    float emberActive = smoothstep(0.0, 0.06, uProgress + uIsHolding * 0.03);
    if (emberActive > 0.001) {
      vec2 dEmber = vec2((uv.x - wick.x) * aspect, uv.y - (wick.y - 0.003));
      float emberSpot = exp(-dot(dEmber, dEmber) / (2.0 * 0.0042 * 0.0042));
      emberAndAirGlow += vec3(1.0, 0.42, 0.10) * emberSpot * emberActive * (0.85 + 0.25 * flicker);
    }

    if (localP <= 0.001) continue;

    // 3. Bán kính vùng hắt sáng lên thân bánh nở rộng từ gần cổ nến ra toàn bộ mặt bánh kem.
    float reachRadius = mix(0.065, 0.78, pow(localP, 0.72));
    float waveWeight = exp(-dist * dist / (2.0 * reachRadius * reachRadius));
    totalLightField += waveWeight * pow(localP, 0.68) * flicker;

    // 4. Dựng ngọn lửa chụp thật DSLR thứ i lớn dần mượt mà từ đốm lửa nhỏ (24%) -> cực đại (106%).
    float growScale = mix(0.24, 1.06, pow(localP, 0.62)) + uPeakGlow * 0.08;
    float curW = FLAME_SIZE[i].x * (0.45 + 0.55 * growScale);
    float curH = FLAME_SIZE[i].y * growScale * (0.96 + 0.04 * flicker);

    // Đưa tọa độ điểm ảnh về hệ quy chiếu neo cứng tại đầu tim bấc (chân lửa không bao giờ trượt khỏi bấc!).
    float windAngle = FLAME_LEAN[i]
      + 0.045 * sin(uTime * 2.3 + ph)
      + 0.024 * sin(uTime * 4.9 + ph * 1.6);
    float ca = cos(-windAngle);
    float sa = sin(-windAngle);
    vec2 rot = vec2(
      dWick.x * ca - dWick.y * sa,
      dWick.x * sa + dWick.y * ca
    );

    // Chiều cao tương đối dọc thân lửa (0.0 tại tim bấc -> 1.0 tại ngọn lửa).
    float hNorm = clamp(-rot.y / max(0.001, curH), -0.25, 1.45);

    // Biến dạng sóng nhiệt & gió uốn mềm phần ngọn lửa như quay video 60fps thực tế:
    // Nhân với hNorm^2 để gốc lửa bám chặt vào bấc nến, chỉ phần thân trên và ngọn lửa uốn lượn.
    float bendFactor = clamp(hNorm, 0.0, 1.35);
    float waveShift = (
      sin(uTime * 5.8 - bendFactor * 3.1 + ph) * 0.095 +
      sin(uTime * 11.4 - bendFactor * 5.2 + ph * 1.8) * 0.042
    ) * (bendFactor * bendFactor) * curW;
    rot.x += waveShift;

    float localX = rot.x / max(0.001, curW);
    if (abs(localX) < 0.96 && hNorm > -0.22 && hNorm < 1.38) {
      // Ánh xạ vào nửa trái (sprite 0) hoặc nửa phải (sprite 1) của ảnh chụp lửa thật cake-flames.jpg.
      float centerAtlasU = FLAME_SPRITE[i] < 0.5 ? 0.25 : 0.75;
      float atlasU = centerAtlasU + localX * 0.215;
      float atlasV = 0.8073 - hNorm * 0.542;

      // Mặt nạ làm mềm siêu mượt ở rìa vùng lấy mẫu để tuyệt đối không bao giờ lộ viền khung ảnh!
      float spriteFeather = (1.0 - smoothstep(0.70, 0.95, abs(localX)))
        * smoothstep(-0.21, -0.05, hNorm)
        * (1.0 - smoothstep(1.10, 1.36, hNorm));

      vec3 rawFlame = texture(uFlamesTex, vec2(atlasU, atlasV)).rgb;
      // Khử hoàn toàn nhiễu nén JPEG cực tối (< 0.018) để nền ngoài ngọn lửa trong suốt 100%.
      vec3 flameSample = max(vec3(0.0), rawFlame - vec3(0.018)) * (1.0 / 0.982) * spriteFeather;
      float flameStrength = smoothstep(0.0, 0.14, localP) * (0.88 + 0.22 * localP + uPeakGlow * 0.18);

      // Hòa trộn quang học kiểu Screen + cộng hưởng vùng lõi sáng để chồng lửa tự nhiên không cháy bệt.
      vec3 fContrib = flameSample * flameStrength;
      combinedFlames = 1.0 - (1.0 - combinedFlames) * (1.0 - clamp(fContrib, 0.0, 1.0));
      combinedFlames += max(vec3(0.0), fContrib - vec3(0.75)) * 0.35;
    }

    // Quầng tán xạ thấu kính máy ảnh (Optical Lens Halation) ấm áp bao quanh ngọn lửa đang cháy.
    vec2 dFlameCenter = vec2((uv.x - wick.x) * aspect, uv.y - (wick.y - curH * 0.45));
    float haloDist = length(dFlameCenter);
    float opticalHalo = exp(-haloDist * haloDist / (2.0 * (0.055 + 0.045 * localP) * (0.055 + 0.045 * localP)));
    emberAndAirGlow += vec3(1.0, 0.58, 0.22) * opticalHalo * localP * 0.095 * flicker;
  }

  // Chuẩn hóa mức hắt sáng tổng hợp trên bánh để ở 3.0 giây chiếc bánh sáng rực rỡ, ấm áp nhất.
  float litMix = clamp(totalLightField * 0.42, 0.0, 1.0);
  litMix = mix(litMix, 1.0, smoothstep(0.72, 1.0, uProgress) * 0.85);

  vec3 baseCake = mix(unlitCol, litCol, clamp(litMix, 0.0, 1.0));

  // Tăng nhẹ ánh cam vàng ấm khi đạt đỉnh 3.0 giây (uPeakGlow).
  baseCake *= 1.0 + uPeakGlow * vec3(0.18, 0.11, 0.05);

  // Ghép thân bánh đã tái chiếu sáng + đốm hồng bấc nến + quầng thấu kính + 6 ngọn lửa chụp thật.
  vec3 finalRgb = baseCake + emberAndAirGlow;
  finalRgb = 1.0 - (1.0 - clamp(finalRgb, 0.0, 1.0)) * (1.0 - clamp(combinedFlames, 0.0, 1.0));
  finalRgb += max(vec3(0.0), combinedFlames - vec3(0.82)) * 0.28;

  // Khi chuyển cảnh sang phần Tâm sự, bánh kem và lửa tan êm thành sương sáng vàng dịu.
  float fadeAlpha = edgeAlpha * (1.0 - smoothstep(0.0, 1.0, uDissolve));
  fragColor = vec4(finalRgb * fadeAlpha, fadeAlpha);
}
`;

// Hàm biên dịch Shader WebGL2 an toàn.
function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Hàm tải ảnh chụp thật lên Texture GPU với bộ lọc tuyến tính mượt mà.
function uploadImageTexture(
  gl: WebGL2RenderingContext,
  unitIndex: number,
  img: HTMLImageElement
): WebGLTexture | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.activeTexture(gl.TEXTURE0 + unitIndex);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
}

export default function RealisticCakeStage({ onComplete }: RealisticCakeStageProps) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isHolding, setIsHolding] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const holdingRef = useRef(false);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const peakGlowRef = useRef(0);
  const dissolveRef = useRef(0);
  const sparksRef = useRef<SparkParticle[]>([]);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const fxCanvas = fxCanvasRef.current;
    if (!glCanvas || !fxCanvas) return;

    let cancelled = false;
    let rafId = 0;
    let finishTimer: number | null = null;
    let dissolveTimer: number | null = null;

    // Khởi tạo ngữ cảnh WebGL2 hỗ trợ kênh trong suốt Premultiplied Alpha để hòa nền tuyệt đối.
    const gl = glCanvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const fallback2dCtx = !gl ? glCanvas.getContext("2d") : null;
    const fxCtx = fxCanvas.getContext("2d");

    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uProgLoc: WebGLUniformLocation | null = null;
    let uHoldLoc: WebGLUniformLocation | null = null;
    let uPeakLoc: WebGLUniformLocation | null = null;
    let uDissolveLoc: WebGLUniformLocation | null = null;
    let texturesReady = false;
    const createdTextures: WebGLTexture[] = [];

    if (gl) {
      const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
      if (vs && fs) {
        const prog = gl.createProgram();
        if (prog) {
          gl.attachShader(prog, vs);
          gl.attachShader(prog, fs);
          gl.linkProgram(prog);
          if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            program = prog;
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            const quadVerts = new Float32Array([
              -1, -1, 1, -1, -1, 1,
              -1, 1, 1, -1, 1, 1,
            ]);
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

            const aPos = gl.getAttribLocation(prog, "aPosition");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            gl.useProgram(prog);
            gl.uniform1i(gl.getUniformLocation(prog, "uUnlitTex"), 0);
            gl.uniform1i(gl.getUniformLocation(prog, "uLitBodyTex"), 1);
            gl.uniform1i(gl.getUniformLocation(prog, "uFlamesTex"), 2);

            uTimeLoc = gl.getUniformLocation(prog, "uTime");
            uProgLoc = gl.getUniformLocation(prog, "uProgress");
            uHoldLoc = gl.getUniformLocation(prog, "uIsHolding");
            uPeakLoc = gl.getUniformLocation(prog, "uPeakGlow");
            uDissolveLoc = gl.getUniformLocation(prog, "uDissolve");

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          }
        }
      }
    }

    // Tải song song cả 3 lớp ảnh chụp thật từ máy ảnh DSLR.
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    let loadedPlates: [HTMLImageElement, HTMLImageElement, HTMLImageElement] | null = null;

    void Promise.all([
      loadImg(cardConfig.cakeUnlitImage),
      loadImg(cardConfig.cakeBodyLitImage),
      loadImg(cardConfig.cakeFlamesImage),
    ])
      .then(([unlitImg, litImg, flamesImg]) => {
        if (cancelled) return;
        loadedPlates = [unlitImg, litImg, flamesImg];
        if (gl && program) {
          const t0 = uploadImageTexture(gl, 0, unlitImg);
          const t1 = uploadImageTexture(gl, 1, litImg);
          const t2 = uploadImageTexture(gl, 2, flamesImg);
          if (t0 && t1 && t2) {
            createdTextures.push(t0, t1, t2);
            texturesReady = true;
          }
        }
      })
      .catch(() => {
        // Nếu mạng nội bộ chậm chưa kịp tải, vòng lặp sẽ tự chờ ảnh sẵn sàng.
      });

    // Đồng bộ kích thước độ phân giải Retina sắc nét cho cả 2 lớp Canvas.
    const updateSize = () => {
      const rect = glCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      glCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
      glCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
      fxCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
      fxCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
      if (fxCtx) {
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    let lastTime = performance.now();
    let uiSyncTimer = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // 1. Cập nhật tiến trình nhấn giữ 3.0 giây để thắp sáng rực rỡ cả 6 ngọn nến thật.
      if (!completedRef.current) {
        if (holdingRef.current) {
          progressRef.current = Math.min(1, progressRef.current + dt / 3.0);
          soundEngine.updateCandleFlame(progressRef.current);

          // Tỏa nhẹ các đốm tàn lửa li ti bay lên từ ngẫu nhiên 1 trong 6 đầu bấc nến.
          if (Math.random() < 0.36) {
            const rect = fxCanvas.getBoundingClientRect();
            const pick = CANDLE_WICKS[Math.floor(Math.random() * CANDLE_WICKS.length)];
            sparksRef.current.push({
              x: rect.width * pick.u + (Math.random() - 0.5) * 6,
              y: rect.height * (pick.v - progressRef.current * pick.heightUV * 0.7),
              vx: (Math.random() - 0.5) * 20,
              vy: -24 - Math.random() * 38,
              life: 0,
              maxLife: 0.45 + Math.random() * 0.5,
              size: 0.9 + Math.random() * 1.4,
            });
          }

          if (progressRef.current >= 1) {
            completedRef.current = true;
            holdingRef.current = false;
            peakGlowRef.current = 1;
            setCompleted(true);
            setIsHolding(false);
            setDisplayProgress(1);
            soundEngine.playCandleFullBloom();

            // Khi nến đạt độ cháy lớn nhất ở giây thứ 3: điểm xuyết bụi lửa ấm bay nhẹ lên từ 6 ngọn nến.
            const rect = fxCanvas.getBoundingClientRect();
            for (const w of CANDLE_WICKS) {
              for (let k = 0; k < 4; k++) {
                sparksRef.current.push({
                  x: rect.width * w.u + (Math.random() - 0.5) * 8,
                  y: rect.height * (w.v - w.heightUV * 0.75),
                  vx: (Math.random() - 0.5) * 32,
                  vy: -26 - Math.random() * 44,
                  life: 0,
                  maxLife: 0.75 + Math.random() * 0.75,
                  size: 1.1 + Math.random() * 1.8,
                });
              }
            }

            // Giữ khung hình bánh kem cháy rực rỡ nhất khoảng 1.4 giây để người nhận kịp ước thầm,
            // sau đó mới tan biến êm ái sang phần các câu Tâm sự.
            dissolveTimer = window.setTimeout(() => {
              setDissolving(true);
            }, 1400);

            finishTimer = window.setTimeout(() => {
              onComplete();
            }, 2450);
          }
        } else if (progressRef.current > 0) {
          // Nếu người nhận thả tay sớm trước 3 giây, ngọn lửa dịu nhỏ dần một cách tự nhiên.
          progressRef.current = Math.max(0, progressRef.current - dt * 0.75);
        }

        uiSyncTimer += dt;
        if (uiSyncTimer > 0.045) {
          uiSyncTimer = 0;
          setDisplayProgress(progressRef.current);
        }
      } else {
        peakGlowRef.current = Math.max(0.25, peakGlowRef.current - dt * 0.55);
        if (fxCanvas.dataset.dissolving === "true" && dissolveRef.current < 1) {
          dissolveRef.current = Math.min(1, dissolveRef.current + dt * 1.05);
        }
      }

      // 2. Vẽ bánh kem & ngọn lửa chụp thật bằng WebGL2 (hoặc dự phòng Canvas 2D nếu trình duyệt tắt GPU).
      if (gl && program && vao && texturesReady) {
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniform1f(uTimeLoc, now * 0.001);
        gl.uniform1f(uProgLoc, progressRef.current);
        gl.uniform1f(uHoldLoc, holdingRef.current ? 1 : 0);
        gl.uniform1f(uPeakLoc, peakGlowRef.current);
        gl.uniform1f(uDissolveLoc, dissolveRef.current);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (fallback2dCtx && loadedPlates) {
        // Chế độ dự phòng Canvas 2D dùng chính 3 tấm ảnh DSLR thật.
        const [unlitImg, litImg, flamesImg] = loadedPlates;
        const cw = glCanvas.width;
        const ch = glCanvas.height;
        fallback2dCtx.clearRect(0, 0, cw, ch);
        fallback2dCtx.globalCompositeOperation = "source-over";
        fallback2dCtx.globalAlpha = 1 - dissolveRef.current;
        fallback2dCtx.drawImage(unlitImg, 0, 0, cw, ch);
        if (progressRef.current > 0.01) {
          fallback2dCtx.globalAlpha = progressRef.current * (1 - dissolveRef.current);
          fallback2dCtx.drawImage(litImg, 0, 0, cw, ch);
          fallback2dCtx.globalCompositeOperation = "screen";
          for (const w of CANDLE_WICKS) {
            const scale = 0.25 + 0.8 * progressRef.current;
            const fw = cw * w.widthUV * 2.1 * scale;
            const fh = ch * w.heightUV * 1.75 * scale;
            const halfAtlasW = flamesImg.naturalWidth * 0.5;
            const fullAtlasH = flamesImg.naturalHeight;
            const sx = w.spriteIdx === 0 ? 0 : halfAtlasW;
            fallback2dCtx.drawImage(
              flamesImg,
              sx,
              0,
              halfAtlasW,
              fullAtlasH,
              cw * w.u - fw * 0.5,
              ch * w.v - fh * 0.81,
              fw,
              fh
            );
          }
        }
      }

      // 3. Vẽ các hạt tàn lửa siêu mịn và làn khói mảnh từ đầu bấc trên lớp Canvas phụ.
      if (fxCtx) {
        const rect = fxCanvas.getBoundingClientRect();
        fxCtx.clearRect(0, 0, rect.width, rect.height);

        const nextSparks: SparkParticle[] = [];
        for (const sp of sparksRef.current) {
          sp.life += dt;
          if (sp.life >= sp.maxLife) continue;
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vx *= 0.98;

          const ratio = sp.life / sp.maxLife;
          const alpha = Math.sin(ratio * Math.PI) * (1 - dissolveRef.current * 0.75);

          if (sp.isSmoke) {
            const rSmoke = sp.size * (1 + ratio * 2.4);
            const g = fxCtx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, rSmoke);
            g.addColorStop(0, `rgba(214, 206, 218, ${alpha * 0.16})`);
            g.addColorStop(1, "rgba(214, 206, 218, 0)");
            fxCtx.fillStyle = g;
            fxCtx.beginPath();
            fxCtx.arc(sp.x, sp.y, rSmoke, 0, Math.PI * 2);
            fxCtx.fill();
          } else {
            const g = fxCtx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.size * 3.0);
            g.addColorStop(0, `rgba(255, 250, 226, ${alpha})`);
            g.addColorStop(0.45, `rgba(255, 182, 86, ${alpha * 0.68})`);
            g.addColorStop(1, "rgba(255, 120, 30, 0)");
            fxCtx.fillStyle = g;
            fxCtx.beginPath();
            fxCtx.arc(sp.x, sp.y, sp.size * 3.0, 0, Math.PI * 2);
            fxCtx.fill();
          }
          nextSparks.push(sp);
        }
        sparksRef.current = nextSparks;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateSize);
      soundEngine.stopCandleFlame();
      if (gl) {
        for (const t of createdTextures) gl.deleteTexture(t);
        if (program) gl.deleteProgram(program);
      }
      if (finishTimer) window.clearTimeout(finishTimer);
      if (dissolveTimer) window.clearTimeout(dissolveTimer);
    };
  }, [onComplete]);

  // Bắt đầu nhấn giữ vào chiếc bánh kem thật để thắp sáng 6 ngọn nến.
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (completedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    holdingRef.current = true;
    setIsHolding(true);
    soundEngine.startCandleIgnite();
  };

  // Khi nhả tay sớm trước 3 giây: thả làn khói mỏng bay lên từ đúng vị trí các tim nến thật.
  const handlePointerUp = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setIsHolding(false);
    soundEngine.stopCandleFlame();

    if (!completedRef.current && progressRef.current > 0.08 && fxCanvasRef.current) {
      const rect = fxCanvasRef.current.getBoundingClientRect();
      for (const w of CANDLE_WICKS) {
        sparksRef.current.push({
          x: rect.width * w.u + (Math.random() - 0.5) * 4,
          y: rect.height * w.v,
          vx: (Math.random() - 0.5) * 8,
          vy: -14 - Math.random() * 12,
          life: 0,
          maxLife: 1.0 + Math.random() * 0.5,
          size: 3.5 + Math.random() * 3,
          isSmoke: true,
        });
      }
    }
  };

  // Dòng chữ thì thầm dưới bánh kem biến chuyển mượt theo đúng từng nhịp giữ tay như video gốc.
  let statusLine = "Nhấn và giữ vào chiếc bánh khoảng 3 giây để thắp sáng nến nhé…";
  if (completed) {
    statusLine = "Nến sinh nhật đã bùng sáng rực rỡ nhất ✦";
  } else if (isHolding) {
    if (displayProgress < 0.36) {
      statusLine = "đang thắp nến cho cậu…";
    } else if (displayProgress < 0.76) {
      statusLine = "giữ nữa… giữ tiếp nhé…";
    } else {
      statusLine = "sắp rực rỡ nhất rồi, nhắm mắt ước ngay nhé…";
    }
  } else if (displayProgress > 0.05) {
    statusLine = "giữ thêm một chút nữa để cả 6 ngọn nến bùng sáng nhé…";
  }

  return (
    <div className={`cake-cinema-stage ${dissolving ? "stage-fade-out" : "stage-fade-in"}`}>
      {/* Khung tương tác bánh kem chụp thật từ máy ảnh DSLR, hòa tan 100% vào nền phòng tối */}
      <button
        type="button"
        className={`cake-interactive-frame ${isHolding ? "is-holding" : ""} ${completed ? "is-lit" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Nhấn và giữ vào bánh kem khoảng 3 giây để thắp sáng những ngọn nến sinh nhật"
      >
        {/* Canvas WebGL2 hiển thị ảnh bánh kem DSLR tái chiếu sáng & 6 ngọn lửa thật 60fps */}
        <canvas ref={glCanvasRef} className="cake-gl-canvas" />
        {/* Canvas phụ trợ vẽ hạt tàn lửa vàng ấm & khói mỏng trên đầu tim nến */}
        <canvas
          ref={fxCanvasRef}
          data-dissolving={dissolving ? "true" : "false"}
          className="cake-fx-canvas"
        />
      </button>

      {/* Cụm lời nhắn tinh tế đặt phía dưới chiếc bánh kem */}
      <div className="cake-caption-group">
        <p className="cake-lead-text">Có một món quà nhỏ dành cho cậu…</p>
        <p className="cake-sub-text">Nhưng trước tiên nhớ thắp nến ước trước nhé</p>

        {/* Thanh ánh sáng mảnh hiển thị tiến trình 3 giây thắp nến */}
        <div className="candle-progress-track" aria-hidden="true">
          <div
            className="candle-progress-fill"
            style={{ transform: `scaleX(${Math.min(1, Math.max(0, displayProgress))})` }}
          />
        </div>

        <p key={statusLine} className="cake-live-whisper">
          {statusLine}
        </p>
      </div>
    </div>
  );
}
