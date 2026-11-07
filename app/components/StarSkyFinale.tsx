"use client";

import { useEffect, useRef, useState } from "react";
import { cardConfig } from "../card-config";
import { soundEngine } from "./SoundEngine";

// ============================================================================
// MÀN KẾT THÚC ĐIỆN ẢNH: ĐIỀU ƯỚC HÓA VÌ SAO THẬT & BAY VÀO DẢI NGÂN HÀ
// (StarSkyFinale.tsx)
// Thay thế hoàn toàn kiểu vẽ ngôi sao 2D hoạt hình bằng hệ thống Quang Học Thiên Văn
// & Thấu Kính Máy Ảnh 50mm f/1.4 trên WebGL2 HDR (60–120fps):
// - Không gian ánh sáng tuyến tính (Linear Photon Space + ACES Filmic Tone Mapping +
//   hạt nhiễu cảm biến ISO 3200) giúp ánh sao hòa quyện vật lý 100% vào bức ảnh chụp thật
//   bầu trời đêm dải Ngân Hà (night-sky.webp) và trường sao sâu (galaxy-deep.webp).
// - Hồ sơ điểm sáng thiên văn Moffat / Airy PSF thực tế: nhân trắng nóng bão hòa cảm biến,
//   quầng sắc cầu vàng sâm panh 24K, tia nhiễu xạ lá khẩu sắc mảnh cố định góc ống kính
//   (tuyệt đối không xoay chong chóng giả), tán sắc quang phổ vi mô, bóng phản xạ thấu kính
//   (Lens Ghosts) và ánh sao phản chiếu lấp lánh xuống mặt hồ nước đêm bên dưới.
// - Khi chạm tay vào ngôi sao: ngôi sao vút bay theo quỹ đạo thiên thể có chiều sâu 3D xa dần,
//   kéo theo vệt plasma sao băng liền mạch (không đứt khúc) rồi định vị vĩnh viễn thành một
//   ngôi sao cấp 1 thật sự lấp lánh tự nhiên giữa lõi sáng dải Ngân Hà.
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

// Vertex Shader trải phẳng khung hình sang hệ tọa độ UV chuẩn (0,0 ở góc trên bên trái).
const STAR_VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Fragment Shader mô phỏng vật lý quang học thiên văn (Astrophotography & 50mm f/1.4 Cinema Lens).
const STAR_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uNightSkyTex;   // Ảnh phơi sáng dải Ngân Hà & mặt hồ đêm (1024x683)
uniform sampler2D uDeepGalaxyTex; // Ảnh trường sao sâu thiên đỉnh (1024x576)

uniform vec2 uResolution;         // Kích thước khung hình thực tế
uniform float uTime;              // Thời gian thực (giây)
uniform int uPhase;               // 1: morphing, 2: starReady, 3: flying, 4: arrived
uniform float uPhaseTime;         // Thời gian trôi qua trong pha hiện tại (giây)
uniform vec2 uPointer;            // Tọa độ chuột/ngón tay chuẩn hóa (0..1)
uniform float uHover;             // Độ phản hồi quang học khi đưa tay lại gần ngôi sao (0..1)

// Hàm băm nhiễu tự nhiên phục vụ hạt cảm biến ISO 3200 & nhiễu khí quyển.
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Nhiễu mượt 2 chiều mô phỏng dòng đối lưu khí quyển đêm (Atmospheric Seeing).
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 3; i++) {
    v += a * valueNoise(p);
    p = rot * p * 2.04 + vec2(13.7, 7.3);
    a *= 0.5;
  }
  return v;
}

// Đường cong nén dải tương phản động điện ảnh ACES Filmic (giúp lõi sao trắng rực tự nhiên không bệt màu).
vec3 acesToneMap(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Ánh xạ chuẩn CSS background-size: cover không bao giờ méo hình hay hở viền trên mọi tỷ lệ màn hình.
vec2 computeCoverScale(float screenAspect, float texAspect, float zoom) {
  vec2 baseScale = screenAspect > texAspect
    ? vec2(1.0, texAspect / screenAspect)
    : vec2(screenAspect / texAspect, 1.0);
  return baseScale / zoom;
}

vec2 screenToCoverUv(vec2 screenUv, vec2 effScale, vec2 focusPos) {
  return screenUv * effScale + focusPos * (1.0 - effScale);
}

vec2 coverUvToScreen(vec2 imgUv, vec2 effScale, vec2 focusPos) {
  return (imgUv - focusPos * (1.0 - effScale)) / effScale;
}

// Khoảng cách từ điểm p tới đoạn thẳng [a, b] cùng tham số nội suy h (0..1) để vẽ đuôi sao băng liền mạch.
vec2 distToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float denom = max(1e-6, dot(ba, ba));
  float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
  return vec2(length(pa - ba * h), h);
}

// Quỹ đạo Bezier bậc 2 đưa ngôi sao bay vòng cung mềm mại từ tay người nhận vào đúng lõi dải Ngân Hà.
vec2 evalAscentPath(float t, vec2 startUv, vec2 ctrlUv, vec2 destUv) {
  float om = 1.0 - t;
  return om * om * startUv + 2.0 * om * t * ctrlUv + t * t * destUv;
}

// ============================================================================
// HÀM QUANG HỌC VÌ SAO CHỤP THẬT (Moffat PSF + Nhiễu Xạ Lá Khẩu Cố Định + Tán Sắc)
// - d       : Vector khoảng cách đẳng hướng tính từ tâm sao (đã nhân tỷ lệ khung hình).
// - scale   : Kích thước quang học (1.0 khi ở gần chờ chạm, thu nhỏ về ~0.145 khi hòa vào Ngân Hà).
// - boost   : Cường độ chớp sáng cảm biến khi mới kết tinh hoặc chạm tay.
// - closeUp : Mức độ hiển thị chi tiết cận cảnh (vệt anamorphic & cấu trúc sắc cầu).
// ============================================================================
vec3 evalPhotorealisticStar(vec2 d, float scale, float boost, float closeUp, float t) {
  float r = length(d);
  float s = max(0.06, scale);

  // 1. Nhịp lấp lánh khí quyển thực tế (Atmospheric Scintillation — đa tần số, không nhấp nháy đều giả tạo).
  float scint = 1.0
    + 0.055 * sin(t * 6.7 + 0.8) * cos(t * 11.3 + 1.9)
    + 0.035 * sin(t * 17.9 + 2.4);

  // Tán sắc nhấp nháy rất khẽ ở rìa do khúc xạ tầng bình lưu (giống sao Thiên Lang Sirius ngoài đời).
  vec3 chromaScint = vec3(
    1.0 + 0.03 * sin(t * 13.1),
    1.0,
    1.0 + 0.03 * cos(t * 14.7 + 1.1)
  );

  // 2. Hồ sơ Moffat PSF 3 tầng chuẩn vật lý thiên văn:
  // Tầng A: Nhân sao cực nóng bão hòa cảm biến (Incandescent Pinpoint Core ~6500K).
  float coreAlpha = 0.0021 * (0.42 + 0.58 * s);
  float corePsf = 1.0 / pow(1.0 + (r * r) / (coreAlpha * coreAlpha), 2.35);

  // Tầng B: Sắc cầu vàng hoàng kim 24K kèm gợn quang học cực mịn trong lòng kính.
  float coronaAlpha = 0.0105 * s;
  float angle = atan(d.y, d.x);
  float subtleCaustic = 0.90 + 0.10 * fbm(vec2(cos(angle), sin(angle)) * 2.6 + vec2(t * 0.16, -t * 0.12));
  float coronaPsf = subtleCaustic / pow(1.0 + (r * r) / (coronaAlpha * coronaAlpha), 1.62);

  // Tầng C: Quầng tán xạ khí quyển đêm Mie/Rayleigh lan êm vào bầu trời sao.
  float haloAlpha = 0.048 * s;
  float haloPsf = 1.0 / pow(1.0 + (r * r) / (haloAlpha * haloAlpha), 1.38);

  vec3 light = vec3(0.0);
  light += vec3(1.0, 0.98, 0.94) * corePsf * 36.0 * boost * scint;
  light += vec3(1.0, 0.79, 0.42) * coronaPsf * 2.35 * boost * scint;
  light += mix(vec3(1.0, 0.76, 0.38), vec3(0.56, 0.70, 0.98), smoothstep(0.015 * s, 0.11 * s, r))
    * haloPsf * 0.24 * boost;

  // 3. Tia nhiễu xạ lá khẩu ống kính DSLR (Fraunhöfer Aperture Diffraction Spikes):
  // Góc nghiêng cố định nhẹ 2.2 độ theo thân máy ảnh — TUYỆT ĐỐI KHÔNG XOAY TRÒN NHƯ CHONG CHÓNG!
  const float camRoll = 0.038;
  float cr = cos(camRoll);
  float sr = sin(camRoll);
  vec2 p4 = vec2(d.x * cr - d.y * sr, d.x * sr + d.y * cr);

  // Độ mảnh kim châm của tia nhiễu xạ (~1 điểm ảnh) kèm vân giao thoa & tán sắc nhẹ dọc tia.
  float needleThickness = max(0.00055, 0.00072 * (0.55 + 0.45 * s));
  float spikeReach = 0.024 * s * (0.85 + 0.25 * boost);

  // Tia chính ngang & dọc (4 cánh thiên văn sắc mảnh, tia ngang nhỉnh hơn nhẹ như cảm biến 35mm).
  float shimmerH = 0.90 + 0.10 * sin(abs(p4.x) * 320.0 - t * 3.2);
  float shimmerV = 0.90 + 0.10 * cos(abs(p4.y) * 320.0 - t * 2.9 + 1.4);

  float hProfile = (1.0 / (1.0 + pow(max(1e-6, abs(p4.y) / needleThickness), 1.92)))
    * (1.0 / (1.0 + pow(max(1e-6, abs(p4.x) / (spikeReach * 1.18)), 1.58)))
    * exp(-abs(p4.x) / (0.14 * s))
    * shimmerH;

  float vProfile = (1.0 / (1.0 + pow(max(1e-6, abs(p4.x) / needleThickness), 1.92)))
    * (1.0 / (1.0 + pow(max(1e-6, abs(p4.y) / (spikeReach * 0.96)), 1.58)))
    * exp(-abs(p4.y) / (0.12 * s))
    * shimmerV;

  // Tán sắc quang học cực tinh tế dọc theo tia nhiễu xạ (đỏ vàng vươn xa hơn lam trắng một chút).
  float radialFrac = clamp(r / max(0.001, 0.09 * s), 0.0, 1.0);
  vec3 spikeSpectrum = mix(
    vec3(1.0, 0.96, 0.88),
    vec3(1.0, 0.78, 0.44),
    radialFrac * 0.72
  ) * chromaScint;

  // Tia phụ 45 độ siêu mảnh của lá khẩu 8 lá (chỉ ánh nhẹ sát nhân sao).
  const float c45 = 0.70710678;
  vec2 pDiag = vec2((p4.x - p4.y) * c45, (p4.x + p4.y) * c45);
  float d1Profile = (1.0 / (1.0 + pow(max(1e-6, abs(pDiag.y) / (needleThickness * 1.15)), 1.95)))
    * exp(-abs(pDiag.x) / (0.028 * s));
  float d2Profile = (1.0 / (1.0 + pow(max(1e-6, abs(pDiag.x) / (needleThickness * 1.15)), 1.95)))
    * exp(-abs(pDiag.y) / (0.028 * s));

  float spikeEnergy = (hProfile + vProfile) * 2.65 + (d1Profile + d2Profile) * 0.48 * closeUp;
  light += spikeSpectrum * spikeEnergy * boost * scint;

  // 4. Vệt lóa ngang thấu kính điện ảnh siêu mảnh (Subtle Cinema Anamorphic Whisper) khi ở cận cảnh.
  if (closeUp > 0.01) {
    float ay = p4.y / 0.0011;
    float anamorphic = (1.0 / (1.0 + ay * ay)) * exp(-abs(p4.x) / (0.19 * s));
    light += vec3(0.86, 0.90, 1.0) * anamorphic * 0.28 * closeUp * boost;
  }

  return light;
}

// Đĩa Bokeh khẩu độ f/1.4 thực tế (có viền cầu sai mảnh đặc trưng của thấu kính khẩu lớn).
float bokehDisc(vec2 d, float radius) {
  float r = length(d) / max(0.0002, radius);
  float fill = 1.0 - smoothstep(0.82, 1.04, r);
  float rim = smoothstep(0.68, 0.92, r) * (1.0 - smoothstep(0.92, 1.06, r));
  return fill * 0.72 + rim * 0.55;
}

void main() {
  float aspect = uResolution.x / max(1.0, uResolution.y);

  // Tiến trình máy quay ngước dần từ mặt hồ rừng thông lên thiên đỉnh dải Ngân Hà khi sao bay lên.
  float flyPan = 0.0;
  if (uPhase == 3) {
    float p = clamp(uPhaseTime / 3.55, 0.0, 1.0);
    flyPan = smoothstep(0.0, 1.0, pow(max(1e-5, p), 0.78));
  } else if (uPhase == 4) {
    flyPan = 1.0;
  }

  // Dao động cầm tay siêu khẽ của máy quay 50mm f/1.4 + phản hồi thị sai nhẹ theo chuột/ngón tay.
  vec2 camBreath = vec2(
    sin(uTime * 0.42) * 0.0022 + (uPointer.x - 0.5) * 0.0045,
    cos(uTime * 0.35) * 0.0018 + (uPointer.y - 0.5) * 0.0035
  );

  // Trên điện thoại dọc, ưu tiên tâm ngang 0.38 để dải Ngân Hà nằm trọn giữa khung hình.
  float focusX = aspect < 0.85 ? 0.38 : 0.50;
  // Khi ngôi sao chưa bay: focusY = 0.95 để thấy rõ cả dải Ngân Hà lẫn mặt hồ nước đêm bên dưới.
  // Khi ngôi sao bay lên cao: máy quay ngước mượt lên focusY = 0.22 ngắm trọn vùng trời sao sâu.
  float focusY = mix(0.95, 0.22, flyPan);
  float camZoom = mix(1.03, 1.12, flyPan);

  vec2 skyEffScale = computeCoverScale(aspect, 1024.0 / 683.0, camZoom);
  vec2 skyFocus = clamp(vec2(focusX, focusY) + camBreath, vec2(0.0), vec2(1.0));
  vec2 skyImgUv = screenToCoverUv(vUv, skyEffScale, skyFocus);

  // Đọc ảnh chụp thật bầu trời đêm dải Ngân Hà & chuyển về không gian ánh sáng tuyến tính (Linear RGB).
  vec3 nightSrgb = texture(uNightSkyTex, skyImgUv).rgb;
  vec3 skyLinear = pow(max(vec3(1e-6), nightSrgb), vec3(2.2)) * mix(0.76, 0.94, flyPan);

  // Hòa quyện thêm lớp trường sao sâu vũ trụ (galaxy-deep.webp) ở nửa trên bầu trời khi ngước máy lên cao.
  if (flyPan > 0.01) {
    vec2 deepEffScale = computeCoverScale(aspect, 1024.0 / 576.0, mix(1.06, 1.01, flyPan));
    vec2 deepImgUv = screenToCoverUv(vUv, deepEffScale, clamp(vec2(0.5, 0.25) + camBreath, vec2(0.0), vec2(1.0)));
    vec3 deepLinear = pow(max(vec3(1e-6), texture(uDeepGalaxyTex, deepImgUv).rgb), vec3(2.2));
    float zenithMask = (1.0 - smoothstep(0.10, 0.72, vUv.y)) * flyPan * 0.42;
    skyLinear += deepLinear * zenithMask;
  }

  // Xác định vị trí ngôi sao cận cảnh & đích đến gắn chặt 1:1 vào đám mây sao sáng của dải Ngân Hà!
  vec2 startScreenUv = vec2(0.50, 0.44) - camBreath * 0.65;
  vec2 destImgUv = vec2(0.378, 0.295);
  vec2 destScreenUv = coverUvToScreen(destImgUv, skyEffScale, skyFocus);
  vec2 ctrlScreenUv = vec2(mix(startScreenUv.x, destScreenUv.x, 0.35) + 0.09, mix(startScreenUv.y, destScreenUv.y, 0.46) - 0.06);

  vec3 hdrLight = vec3(0.0);
  vec2 activeStarScreenUv = startScreenUv;
  float waterReflectionStrength = 0.0;

  // --------------------------------------------------------------------------
  // NHỊP 1 -> 2 (uPhase == 1): Hạt bụi sáng & Bokeh f/1.4 hội tụ kết tinh thành Ngôi Sao
  // --------------------------------------------------------------------------
  if (uPhase == 1) {
    float p = clamp(uPhaseTime / 1.65, 0.0, 1.0);
    float invTwoP = 2.0 - 2.0 * p;
    float converge = p < 0.5 ? 2.0 * p * p : 1.0 - (invTwoP * invTwoP) * 0.5;

    for (int i = 0; i < 42; i++) {
      float fi = float(i);
      float seedA = hash12(vec2(fi * 1.7, 3.1));
      float seedB = hash12(vec2(fi * 2.9, 9.7));

      // Khởi phát từ vùng tấm thiệp nhũ vàng và xoáy nhẹ theo bảo toàn mô-men động lượng vào tâm sao.
      float baseAngle = seedA * 6.283185 + converge * (2.2 + seedB * 2.4);
      float startRad = (0.07 + seedB * 0.26) * pow(max(1e-5, 1.0 - converge), 1.55);
      vec2 moteUv = startScreenUv + vec2(cos(baseAngle) * startRad / max(0.65, aspect), sin(baseAngle) * startRad * 0.78);
      vec2 dMote = vec2((vUv.x - moteUv.x) * aspect, vUv.y - moteUv.y);

      float moteFade = sin(clamp(p * 1.25, 0.0, 1.0) * 3.14159);
      vec3 moteCol = (i % 5 == 0)
        ? vec3(0.75, 0.86, 1.0)
        : mix(vec3(1.0, 0.78, 0.38), vec3(1.0, 0.96, 0.88), seedA);

      if (i % 3 == 0) {
        // Đĩa bokeh khẩu lớn f/1.4 ở tiền cảnh thu nhỏ dần khi lấy nét vào ngôi sao.
        float bRad = (0.006 + seedB * 0.011) * (1.0 - converge * 0.75);
        hdrLight += moteCol * bokehDisc(dMote, bRad) * 0.16 * moteFade;
      } else {
        // Điểm tàn sáng sắc nét như bụi kim loại nóng sáng.
        float distSq = dot(dMote, dMote);
        float pinpoint = 1.0 / (1.0 + distSq / (0.0014 * 0.0014));
        hdrLight += moteCol * pinpoint * 0.52 * moteFade;
      }
    }

    // Ngôi sao lóe sáng lấp đầy cảm biến ở khoảnh khắc kết tinh rồi dịu về độ nét chuẩn.
    float starEmergence = smoothstep(0.26, 0.96, p);
    float bf = (p - 0.84) / 0.12;
    float birthFlash = 1.0 + 1.45 * exp(-(bf * bf));
    vec2 dStar = vec2((vUv.x - startScreenUv.x) * aspect, vUv.y - startScreenUv.y);
    hdrLight += evalPhotorealisticStar(dStar, mix(0.28, 1.0, starEmergence), starEmergence * birthFlash, starEmergence, uTime);
    waterReflectionStrength = starEmergence * 0.85;
  }

  // --------------------------------------------------------------------------
  // NHỊP 2 (uPhase == 2): Ngôi Sao Quang Học Cận Cảnh Chờ Người Nhận Chạm Tay Vào
  // --------------------------------------------------------------------------
  else if (uPhase == 2) {
    float hoverBoost = 1.0 + uHover * 0.32;
    vec2 dStar = vec2((vUv.x - startScreenUv.x) * aspect, vUv.y - startScreenUv.y);
    hdrLight += evalPhotorealisticStar(dStar, 1.0 + uHover * 0.05, hoverBoost, 1.0, uTime);

    // 14 hạt bụi sao siêu mảnh trôi nhẹ tự nhiên lên trên trong luồng khí đêm (có cả nét căng & bokeh mờ).
    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      float cycle = fract(uTime * (0.11 + 0.04 * hash12(vec2(fi, 1.3))) + fi * 0.0714);
      float driftX = (hash12(vec2(fi, 5.2)) - 0.5) * 0.11 + sin(uTime * 0.9 + fi * 2.1) * 0.008;
      float driftY = 0.035 - cycle * 0.13;
      vec2 spUv = startScreenUv + vec2(driftX / max(0.7, aspect), driftY);
      vec2 dSp = vec2((vUv.x - spUv.x) * aspect, vUv.y - spUv.y);
      float spAlpha = sin(cycle * 3.14159) * 0.65;

      if (i % 4 == 0) {
        hdrLight += vec3(1.0, 0.82, 0.46) * bokehDisc(dSp, 0.0055 + 0.003 * hash12(vec2(fi, 8.4))) * 0.065 * spAlpha;
      } else {
        float spCore = 1.0 / (1.0 + dot(dSp, dSp) / (0.00095 * 0.00095));
        hdrLight += vec3(1.0, 0.90, 0.68) * spCore * 0.36 * spAlpha;
      }
    }

    // Phản xạ thấu kính nhiều lớp phủ (Multi-Coated 50mm f/1.4 Optical Lens Ghosts) siêu dịu qua tâm ảnh.
    vec2 lensCenter = vec2(0.5, 0.5);
    vec2 flareAxis = lensCenter - (startScreenUv + (uPointer - 0.5) * 0.035);
    vec2 ghost1Uv = lensCenter + flareAxis * 0.68;
    vec2 ghost2Uv = lensCenter + flareAxis * 1.32;
    vec2 dG1 = vec2((vUv.x - ghost1Uv.x) * aspect, vUv.y - ghost1Uv.y);
    vec2 dG2 = vec2((vUv.x - ghost2Uv.x) * aspect, vUv.y - ghost2Uv.y);
    hdrLight += vec3(1.0, 0.78, 0.42) * bokehDisc(dG1, 0.024) * (0.024 + 0.018 * uHover);
    hdrLight += vec3(0.52, 0.82, 0.96) * bokehDisc(dG2, 0.042) * (0.015 + 0.012 * uHover);

    waterReflectionStrength = 1.0 + uHover * 0.22;
  }

  // --------------------------------------------------------------------------
  // NHỊP 3 (uPhase == 3): Chạm Sao -> Ngôi Sao Bùng Vệt Sao Băng Thật Bay Lên Ngân Hà
  // --------------------------------------------------------------------------
  else if (uPhase == 3) {
    float rawT = clamp(uPhaseTime / 3.45, 0.0, 1.0);
    // Đường cong gia tốc liên tục mượt 100%: rời tay êm rồi vút nhanh vào chiều sâu vũ trụ.
    float smoothBase = smoothstep(0.0, 1.0, rawT);
    float fastGlide = 1.0 - pow(max(1e-5, 1.0 - rawT), 2.35);
    float headT = clamp(mix(smoothBase, fastGlide, smoothstep(0.0, 0.35, rawT)), 0.0, 1.0);

    // Tỷ lệ phối cảnh 3D xa dần thực tế (1 / (1 + z)) để ngôi sao thu nhỏ thành vì sao thật trên trời cao.
    float perspectiveScale = mix(0.145, 1.0, 1.0 / (1.0 + headT * 5.8));
    float touchFlash = 1.0 + 1.55 * exp(-uPhaseTime * 5.5);
    float ag = (rawT - 0.93) / 0.055;
    float arrivalGlint = 1.0 + 1.25 * exp(-(ag * ag));

    vec2 headUv = evalAscentPath(headT, startScreenUv, ctrlScreenUv, destScreenUv);
    activeStarScreenUv = headUv;

    // Tích phân liên tục 20 đoạn vi phân dọc quỹ đạo tạo vệt ion hóa sao băng liền mạch 100% (không đứt hạt!).
    float tailSpan = 0.24 * sin(clamp(rawT * 1.35, 0.0, 1.0) * 3.14159 * 0.88) * (1.0 - smoothstep(0.84, 1.0, rawT));
    if (tailSpan > 0.002 && headT > 0.002) {
      vec2 pMetric = vec2(vUv.x * aspect, vUv.y);
      const int SEGMENTS = 20;
      float tStart = max(0.0, headT - tailSpan);
      float stepT = (headT - tStart) / float(SEGMENTS);

      vec2 prevPt = evalAscentPath(tStart, startScreenUv, ctrlScreenUv, destScreenUv);
      prevPt = vec2(prevPt.x * aspect, prevPt.y);

      for (int s = 1; s <= SEGMENTS; s++) {
        float curSampleT = tStart + stepT * float(s);
        float ageFrac = max(1e-5, float(s) / float(SEGMENTS)); // 0 ở chóp đuôi mờ -> 1 sát đầu sao băng nóng rực
        float windAge = 1.0 - ageFrac;

        // Gió tầng bình lưu làm dải khói ion hóa phía sau tản nhẹ rất tự nhiên.
        vec2 windDrift = vec2(
          sin(curSampleT * 18.0 + uTime * 1.6) * 0.0035 * windAge,
          cos(curSampleT * 14.0 - uTime * 1.2) * 0.0025 * windAge
        );

        vec2 curUv = evalAscentPath(curSampleT, startScreenUv, ctrlScreenUv, destScreenUv) + windDrift;
        vec2 curPt = vec2(curUv.x * aspect, curUv.y);

        vec2 seg = distToSegment(pMetric, prevPt, curPt);
        float dLine = seg.x;
        float localScale = mix(0.18, 1.0, 1.0 / (1.0 + curSampleT * 5.0));

        // Lõi sợi đốt trắng vàng cực mảnh + dải sương ion hóa vàng sâm panh / lam khí quyển.
        float coreWidth = max(0.00055, 0.0018 * localScale * (0.25 + 0.75 * ageFrac));
        float wakeWidth = max(0.0022, 0.0095 * localScale * (0.45 + 0.55 * windAge));

        float coreLine = exp(-(dLine * dLine) / (2.0 * coreWidth * coreWidth));
        float wakeGlow = exp(-(dLine * dLine) / (2.0 * wakeWidth * wakeWidth));

        float taper = pow(ageFrac, 1.65);
        hdrLight += vec3(1.0, 0.92, 0.74) * coreLine * taper * 0.34;
        hdrLight += mix(vec3(0.58, 0.78, 1.0), vec3(1.0, 0.78, 0.40), ageFrac) * wakeGlow * pow(ageFrac, 1.15) * 0.055;

        prevPt = curPt;
      }
    }

    vec2 dHead = vec2((vUv.x - headUv.x) * aspect, vUv.y - headUv.y);
    hdrLight += evalPhotorealisticStar(
      dHead,
      perspectiveScale,
      touchFlash * arrivalGlint,
      smoothstep(0.25, 0.95, perspectiveScale),
      uTime
    );

    waterReflectionStrength = (1.0 - smoothstep(0.0, 0.65, rawT));
  }

  // --------------------------------------------------------------------------
  // NHỊP 4 (uPhase == 4): Đã Hòa Vào Lõi Dải Ngân Hà Thành Một Vì Sao Cấp 1 Thật Sự
  // --------------------------------------------------------------------------
  else if (uPhase == 4) {
    activeStarScreenUv = destScreenUv;
    float settleGlow = 1.0 + 0.38 * exp(-uPhaseTime * 1.8);
    vec2 dDest = vec2((vUv.x - destScreenUv.x) * aspect, vUv.y - destScreenUv.y);
    // Kích thước 0.145 khớp hoàn hảo với độ sắc nét & quầng nhũ tương của các ngôi sao sáng thật trong ảnh!
    hdrLight += evalPhotorealisticStar(dDest, 0.145, 1.05 * settleGlow, 0.0, uTime);
  }

  // --------------------------------------------------------------------------
  // ÁNH SAO PHẢN CHIẾU LẤP LÁNH TRÊN MẶT NƯỚC HỒ ĐÊM THẬT (y > 0.914 trong night-sky.webp)
  // --------------------------------------------------------------------------
  if (waterReflectionStrength > 0.005 && skyImgUv.y > 0.908) {
    float lakeMask = smoothstep(0.912, 0.932, skyImgUv.y) * smoothstep(0.15, 0.28, skyImgUv.x);
    vec2 starInImg = screenToCoverUv(activeStarScreenUv, skyEffScale, skyFocus);
    float dxWater = (skyImgUv.x - starInImg.x);
    float dyWater = (skyImgUv.y - 0.955);

    // Sóng gợn lăn tăn ngang trên mặt hồ đêm làm cột ánh sao phản chiếu đứt quãng tự nhiên.
    float rippleWave = sin(skyImgUv.y * 390.0 - uTime * 2.6 + fbm(skyImgUv * vec2(18.0, 65.0)) * 5.2);
    float rippleShimmer = 0.55 + 0.45 * rippleWave;
    float xSpread = 0.022 + abs(dyWater) * 0.35;
    float waterColumn = exp(-(dxWater * dxWater) / (2.0 * xSpread * xSpread))
      * exp(-(dyWater * dyWater) / (2.0 * 0.032 * 0.032));

    hdrLight += vec3(1.0, 0.78, 0.40) * waterColumn * rippleShimmer * lakeMask * waterReflectionStrength * 0.14;
  }

  // Cộng tuyến tính ánh sáng bầu trời sao thật + ánh sáng vật lý của Ngôi Sao Ước Nguyện,
  // nén qua đường cong điện ảnh ACES Filmic rồi phủ hạt cảm biến máy ảnh ISO 3200 đồng nhất!
  vec3 combinedLinear = skyLinear + hdrLight;
  vec3 mappedSrgb = pow(max(vec3(1e-6), acesToneMap(combinedLinear)), vec3(1.0 / 2.2));

  // Hạt nhiễu cảm biến CMOS phơi sáng đêm siêu mịn để ngôi sao mang đúng chất ảnh chụp thật 100%.
  float sensorGrain = (hash12(gl_FragCoord.xy + fract(uTime) * 137.0) - 0.5) * 0.018;
  mappedSrgb = clamp(mappedSrgb + vec3(sensorGrain), 0.0, 1.0);

  fragColor = vec4(mappedSrgb, 1.0);
}
`;

// Hàm biên dịch Shader WebGL2 an toàn.
function compileGlShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

// Hàm tải ảnh chụp bầu trời đêm lên GPU Texture với bộ lọc Mipmap mượt mà.
function createSkyTexture(
  gl: WebGL2RenderingContext,
  unit: number,
  img: HTMLImageElement
): WebGLTexture | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
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
  const [glReady, setGlReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<FinalePhase>("card");
  const phaseStartRef = useRef<number>(0);
  const pointerUvRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const hoverTargetRef = useRef(0);
  const hoverSmoothRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
    phaseStartRef.current = performance.now();
  }, [phase]);

  // Nhịp 1 -> Nhịp 2: Biến điều ước thành 1 ngôi sao thiên văn thật lấp lánh chờ chạm tay.
  const handleTransformToStar = () => {
    if (phase !== "card") return;
    soundEngine.playWishToStar();
    setPhase("morphing");
    window.setTimeout(() => {
      setPhase("starReady");
    }, 1650);
  };

  // Nhịp 2 -> Nhịp 3: Người dùng chạm vào ngôi sao -> Ngôi sao hóa sao băng bay sâu vào dải Ngân Hà.
  const handleTouchStar = () => {
    if (phase !== "starReady") return;
    hoverTargetRef.current = 0;
    soundEngine.playStarAscend();
    setPhase("flying");
    window.setTimeout(() => {
      setPhase("arrived");
    }, 3550);
  };

  // Khởi tạo sẵn ngữ cảnh WebGL2 & tải trước ảnh bầu trời đêm ngay khi đang đọc thiệp
  // để khoảnh khắc bấm gửi điều ước chuyển cảnh mượt tức thì không trễ 1 khung hình nào.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let rafId = 0;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    const fallbackCtx = !gl ? canvas.getContext("2d") : null;

    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let uResLoc: WebGLUniformLocation | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uPhaseLoc: WebGLUniformLocation | null = null;
    let uPhaseTimeLoc: WebGLUniformLocation | null = null;
    let uPointerLoc: WebGLUniformLocation | null = null;
    let uHoverLoc: WebGLUniformLocation | null = null;
    let texturesUploaded = false;
    const gpuTextures: WebGLTexture[] = [];

    if (gl) {
      const vs = compileGlShader(gl, gl.VERTEX_SHADER, STAR_VERTEX_SHADER);
      const fs = compileGlShader(gl, gl.FRAGMENT_SHADER, STAR_FRAGMENT_SHADER);
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

            const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

            const aPos = gl.getAttribLocation(prog, "aPosition");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            gl.useProgram(prog);
            gl.uniform1i(gl.getUniformLocation(prog, "uNightSkyTex"), 0);
            gl.uniform1i(gl.getUniformLocation(prog, "uDeepGalaxyTex"), 1);

            uResLoc = gl.getUniformLocation(prog, "uResolution");
            uTimeLoc = gl.getUniformLocation(prog, "uTime");
            uPhaseLoc = gl.getUniformLocation(prog, "uPhase");
            uPhaseTimeLoc = gl.getUniformLocation(prog, "uPhaseTime");
            uPointerLoc = gl.getUniformLocation(prog, "uPointer");
            uHoverLoc = gl.getUniformLocation(prog, "uHover");
          }
        }
      }
    }

    const loadSkyImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    void Promise.all([
      loadSkyImage(nightSkyImageUrl),
      loadSkyImage(cardConfig.deepGalaxyImage),
    ])
      .then(([nightImg, deepImg]) => {
        if (cancelled) return;
        if (gl && program) {
          const t0 = createSkyTexture(gl, 0, nightImg);
          const t1 = createSkyTexture(gl, 1, deepImg);
          if (t0 && t1) {
            gpuTextures.push(t0, t1);
            texturesUploaded = true;
            setGlReady(true);
          }
        }
      })
      .catch(() => {
        // Nếu tải chậm, lớp nền CSS dự phòng phía sau vẫn hiển thị mượt mà.
      });

    let cssW = window.innerWidth;
    let cssH = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      if (fallbackCtx) {
        fallbackCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const onWindowPointerMove = (e: PointerEvent) => {
      const nx = e.clientX / Math.max(1, cssW);
      const ny = e.clientY / Math.max(1, cssH);
      pointerUvRef.current = { x: nx, y: ny };

      if (phaseRef.current === "starReady") {
        const dx = e.clientX - cssW * 0.5;
        const dy = e.clientY - cssH * 0.44;
        const distPx = Math.hypot(dx, dy);
        hoverTargetRef.current = Math.max(0, Math.min(1, 1 - (distPx - 24) / 110));
      }
    };
    window.addEventListener("pointermove", onWindowPointerMove, { passive: true });

    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const curPhase = phaseRef.current;
      // Khi đang ở màn đọc thiệp (card), tạm nghỉ vẽ để tiết kiệm 100% GPU cho đến lúc bấm nút.
      if (curPhase === "card") {
        rafId = window.requestAnimationFrame(renderLoop);
        return;
      }

      hoverSmoothRef.current += (hoverTargetRef.current - hoverSmoothRef.current) * Math.min(1, dt * 7.5);
      const phaseElapsed = Math.max(0, (now - phaseStartRef.current) / 1000);

      const phaseCode =
        curPhase === "morphing"
          ? 1
          : curPhase === "starReady"
            ? 2
            : curPhase === "flying"
              ? 3
              : 4;

      if (gl && program && vao && texturesUploaded) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniform2f(uResLoc, canvas.width, canvas.height);
        gl.uniform1f(uTimeLoc, now * 0.001);
        gl.uniform1i(uPhaseLoc, phaseCode);
        gl.uniform1f(uPhaseTimeLoc, phaseElapsed);
        gl.uniform2f(uPointerLoc, pointerUvRef.current.x, pointerUvRef.current.y);
        gl.uniform1f(uHoverLoc, hoverSmoothRef.current);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (fallbackCtx) {
        // Dự phòng Canvas 2D tối giản nếu trình duyệt tắt hoàn toàn WebGL2.
        fallbackCtx.clearRect(0, 0, cssW, cssH);
        const sx = curPhase === "arrived" ? cssW * 0.38 : cssW * 0.5;
        const sy = curPhase === "arrived" ? cssH * 0.28 : cssH * 0.44;
        const r = curPhase === "arrived" ? 7 : 34;
        const g = fallbackCtx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, "rgba(255, 255, 255, 1)");
        g.addColorStop(0.18, "rgba(255, 224, 152, 0.72)");
        g.addColorStop(1, "rgba(255, 200, 110, 0)");
        fallbackCtx.fillStyle = g;
        fallbackCtx.beginPath();
        fallbackCtx.arc(sx, sy, r, 0, Math.PI * 2);
        fallbackCtx.fill();
      }

      rafId = window.requestAnimationFrame(renderLoop);
    };

    rafId = window.requestAnimationFrame(renderLoop);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onWindowPointerMove);
      if (gl) {
        for (const t of gpuTextures) gl.deleteTexture(t);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [nightSkyImageUrl]);

  const showNightSky = phase !== "card";
  const skyPanUp = phase === "flying" || phase === "arrived";

  return (
    <div className="finale-cinema-wrapper">
      {/* Lớp nền CSS dự phòng (tự ẩn nhường chỗ khi khung hình WebGL2 HDR đã sẵn sàng) */}
      {!glReady && (
        <>
          <div
            className={`real-night-sky-backdrop ${showNightSky ? "is-visible" : ""} ${skyPanUp ? "camera-pan-sky" : ""}`}
            style={{ backgroundImage: `url("${nightSkyImageUrl}")` }}
            aria-hidden="true"
          />
          <div
            className={`real-deep-galaxy-layer ${skyPanUp ? "is-visible" : ""}`}
            style={{ backgroundImage: `url("${cardConfig.deepGalaxyImage}")` }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Khung hình WebGL2 HDR 60fps dựng đồng nhất Bầu Trời Ngân Hà + Ngôi Sao Thiên Văn + Phản Chiếu Mặt Hồ */}
      <canvas
        ref={canvasRef}
        className={`finale-star-canvas ${showNightSky ? "is-active" : ""}`}
        aria-hidden="true"
      />

      {/* NHỊP 1: Tấm thiệp giấy mỹ thuật đen xé viền dập nhũ vàng kim (tan chảy mượt thành bụi sao khi gửi) */}
      {(phase === "card" || phase === "morphing") && (
        <div
          className={`ornate-final-stage ${phase === "morphing" ? "is-dissolving" : "stage-fade-in"}`}
          aria-hidden={phase === "morphing"}
        >
          <svg className="sr-svg-defs" aria-hidden="true">
            <defs>
              <filter id="finale-card-deckle" x="-4%" y="-4%" width="108%" height="108%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.042"
                  numOctaves="3"
                  seed="23"
                  result="cardNoise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="cardNoise"
                  scale="4.0"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>

          <div className="ornate-double-frame">
            <span className="ornate-deckle-bg" aria-hidden="true">
              <span
                className="ornate-card-grain"
                style={{ backgroundImage: `url("${cardConfig.kraftPaperImage}")` }}
              />
            </span>
            <span className="ornate-foil-rule rule-top" aria-hidden="true" />
            <span className="ornate-foil-rule rule-bottom" aria-hidden="true" />

            <p className="ornate-top-label">✦ DÀNH CHO {recipient.toUpperCase()} ✦</p>
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
                placeholder={`Viết thêm điều ước thầm kín của ${recipient} trên dòng nhũ vàng…`}
                className="secret-wish-input"
                maxLength={120}
              />
              <span className="secret-wish-underline" aria-hidden="true" />
            </div>
          </div>

          <div className="ornate-actions">
            <button
              type="button"
              className="golden-amber-btn"
              onClick={handleTransformToStar}
            >
              <span>✦</span>
              <span>Gửi điều ước hóa thành ngôi sao</span>
              <span>✦</span>
            </button>
            <button type="button" className="restart-underline-btn" onClick={onRestart}>
              ↺ Xem lại tấm thiệp từ đầu
            </button>
          </div>
        </div>
      )}

      {/* NHỊP 2: Điều ước đã hóa thành 1 Ngôi Sao Thiên Văn Thật — Chờ người dùng chạm tay vào */}
      {phase === "starReady" && (
        <div className="star-touch-overlay stage-fade-in">
          <button
            type="button"
            className="interactive-star-hitbox"
            onClick={handleTouchStar}
            onPointerEnter={() => {
              hoverTargetRef.current = 1;
            }}
            onPointerLeave={() => {
              hoverTargetRef.current = 0;
            }}
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

      {/* NHỊP 3: Lời kết tĩnh lặng dưới bầu trời dải Ngân Hà thật sau khi sao đã hòa vào vũ trụ */}
      {phase === "arrived" && (
        <div className="sky-epilogue-panel stage-fade-in">
          <p className="cinema-eyebrow">ĐIỀU ƯỚC ĐÃ THUỘC VỀ BẦU TRỜI ĐÊM</p>
          <h2 className="sky-epilogue-title">
            Vì sao của <em>{recipient}</em> đang lấp lánh trên cao
          </h2>
          <p className="sky-epilogue-copy">
            Mỗi khi ngước nhìn bầu trời đêm, hãy nhớ rằng luôn có những điều ấm áp nhất đang hướng về cậu. Chúc mừng sinh nhật nhé!
          </p>
          <button type="button" className="cinema-pill-btn golden-glow" onClick={onRestart}>
            <span>Xem lại tấm thiệp từ đầu</span>
            <span aria-hidden="true">↺</span>
          </button>
        </div>
      )}
    </div>
  );
}
