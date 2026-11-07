// ============================================================================
// BỘ TỔNG HỢP ÂM THANH ĐIỆN ẢNH & HỘP NHẠC PIANO (SoundEngine.ts)
// Tạo nhạc nền Piano & Celesta "Happy Birthday" ấm áp khi người dùng chưa gắn file MP3,
// đồng thời tái tạo các âm thanh tương tác chân thực: mở phong bì giấy, vòng xoay số,
// tiếng đánh lửa & ngọn nến cháy ấm dần, tiếng chuông điều ước và sao băng bay lên trời.
// ============================================================================

class CinemaSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isMuted = false;
  private musicTimer: number | null = null;
  private isPlayingSynthMusic = false;
  private noteStep = 0;

  // Các nút âm thanh phục vụ tiếng lửa nến cháy liên tục khi người nhận nhấn giữ.
  private flameNoiseSource: AudioBufferSourceNode | null = null;
  private flameFilter: BiquadFilterNode | null = null;
  private flameGain: GainNode | null = null;

  // Khởi tạo ngữ cảnh âm thanh Web Audio API và tạo hiệu ứng vang phòng tự nhiên (Reverb).
  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Nút âm lượng tổng để bật/tắt tiếng mượt mà không gây tiếng "bụp".
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;
      this.masterGain.connect(this.ctx.destination);

      // Tạo xung phản xạ âm học giả lập căn phòng gỗ ấm áp cho tiếng đàn Piano.
      this.reverbNode = this.createWarmRoomReverb(this.ctx);
      this.reverbNode.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  // Tạo bộ đệm tiếng vang không gian (Impulse Response) dài 2.4 giây mượt như phòng thu.
  private createWarmRoomReverb(ctx: AudioContext): ConvolverNode {
    const convolver = ctx.createConvolver();
    const duration = 2.4;
    const length = Math.floor(ctx.sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        // Đường suy giảm hàm mũ kết hợp lọc mềm giúp tiếng vang êm và sâu.
        const envelope = Math.pow(1 - progress, 2.8);
        data[i] = (Math.random() * 2 - 1) * envelope * 0.28;
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  // Phát một nốt đàn Piano kết hợp chuông Celesta dịu dàng theo tần số Hz.
  private playPianoNote(freq: number, duration: number, volume = 0.14, delaySec = 0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.reverbNode) return;

    const now = ctx.currentTime + delaySec;

    // Dao động chính (âm sắc thân đàn ấm) và dao động bồi bậc hai (độ trong trẻo như hộp nhạc).
    const oscFundamental = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    oscFundamental.type = "triangle";
    oscFundamental.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = "sine";
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    // Bộ lọc thông thấp mô phỏng búa đàn bọc nỉ gõ nhẹ vào dây đàn.
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(3600, freq * 5.2), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(380, freq * 1.6), now + duration);

    // Đường bao âm lượng: chạm êm (attack 22ms) và ngân dài tự nhiên.
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(volume, now + 0.022);
    env.gain.exponentialRampToValueAtTime(volume * 0.42, now + duration * 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.22;

    oscFundamental.connect(filter);
    oscHarmonic.connect(harmonicGain);
    harmonicGain.connect(filter);

    filter.connect(env);
    env.connect(this.masterGain);
    env.connect(this.reverbNode);

    oscFundamental.start(now);
    oscHarmonic.start(now);
    oscFundamental.stop(now + duration + 0.06);
    oscHarmonic.stop(now + duration + 0.06);
  }

  // Bắt đầu phát bản phối Piano chậm "Happy Birthday" lặp lại nhẹ nhàng làm nhạc nền.
  public startAmbientBirthdayMusic() {
    const ctx = this.ensureContext();
    if (!ctx || this.isPlayingSynthMusic) return;

    this.isPlayingSynthMusic = true;
    this.noteStep = 0;

    // Giai điệu Happy Birthday cung Fa trưởng (F Major) phối hợp âm rải sâu lắng.
    // Mỗi phần tử gồm: [nốt giai điệu Hz, các nốt đệm trầm Hz, độ dài phách (ms)].
    const arrangement: Array<[number, number[], number]> = [
      [261.63, [174.61], 480], // C4
      [261.63, [], 340], // C4
      [293.66, [174.61, 220.0], 820], // D4 (hợp âm F)
      [261.63, [], 820], // C4
      [349.23, [261.63], 820], // F4
      [329.63, [196.0, 246.94], 1550], // E4 (hợp âm C/G)

      [261.63, [], 480], // C4
      [261.63, [], 340], // C4
      [293.66, [196.0, 233.08], 820], // D4 (Gm/C)
      [261.63, [], 820], // C4
      [392.0, [261.63], 820], // G4
      [349.23, [174.61, 220.0], 1550], // F4 (hợp âm F)

      [261.63, [], 480], // C4
      [261.63, [], 340], // C4
      [523.25, [146.83, 220.0], 920], // C5 (Dm7)
      [440.0, [], 820], // A4
      [349.23, [233.08], 820], // F4
      [329.63, [174.61], 840], // E4
      [293.66, [233.08, 293.66], 1450], // D4 (Bb)

      [466.16, [], 480], // Bb4
      [466.16, [], 340], // Bb4
      [440.0, [174.61, 261.63], 820], // A4 (F/C)
      [349.23, [], 820], // F4
      [392.0, [196.0, 261.63], 860], // G4 (C7)
      [349.23, [174.61, 220.0, 261.63], 2200], // F4 ngân dài kết câu
    ];

    const scheduleNext = () => {
      if (!this.isPlayingSynthMusic) return;
      const [melody, bassNotes, waitMs] = arrangement[this.noteStep % arrangement.length];

      // Phát nốt giai điệu chính.
      this.playPianoNote(melody, Math.max(1.6, (waitMs / 1000) * 2.1), 0.115, 0);

      // Rải nhẹ các nốt trầm bên tay trái để tạo chiều sâu điện ảnh.
      bassNotes.forEach((bassFreq, idx) => {
        this.playPianoNote(bassFreq, 2.7, 0.065, idx * 0.055);
      });

      this.noteStep += 1;
      this.musicTimer = window.setTimeout(scheduleNext, waitMs);
    };

    scheduleNext();
  }

  // Dừng hẳn bộ phát nhạc Piano tự động khi cần đặt lại từ đầu.
  public stopAmbientBirthdayMusic() {
    this.isPlayingSynthMusic = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // Điều chỉnh trạng thái bật/tắt âm thanh toàn cục mượt mà.
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.85, now + 0.18);
    }
  }

  // Âm thanh phép màu mở Ấn Sáp Vàng phong cách Harry Potter (Celesta huyền ảo + tiếng nứt sáp mở thư):
  // Đánh thức trình duyệt phát nhạc ngay khoảnh khắc người nhận chạm tay mở trang đầu tiên.
  public playHogwartsSealOpen() {
    this.playPaperOpen();

    // Chuỗi quãng chuông Celesta huyền bí gợi không khí lâu đài ánh nến vàng (B4 -> E5 -> G5 -> F#5 -> E5 -> B5).
    const celestaMotif: Array<[number, number, number, number]> = [
      [493.88, 1.9, 0.075, 0.02], // B4
      [659.25, 2.1, 0.085, 0.16], // E5
      [783.99, 1.8, 0.08, 0.34],  // G5
      [739.99, 1.9, 0.075, 0.48], // F#5
      [659.25, 2.3, 0.085, 0.64], // E5
      [987.77, 2.6, 0.07, 0.86],  // B5 ngân sáng lấp lánh
    ];

    celestaMotif.forEach(([freq, dur, vol, delay]) => {
      this.playPianoNote(freq, dur, vol, delay);
    });
  }

  // Tiếng sột soạt mở phong bì giấy thủ công khi bấm "Mở thiệp".
  public playPaperOpen() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const length = Math.floor(ctx.sampleRate * 0.32);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.sin(t * Math.PI) * Math.pow(1 - t, 1.3);
      data[i] = (Math.random() * 2 - 1) * env * 0.25;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1350;
    filter.Q.value = 1.1;

    src.connect(filter);
    filter.connect(this.masterGain);
    src.start();
  }

  // Tiếng "tích" cơ khí siêu mịn như vòng khẩu độ máy ảnh khi vòng số ngày chạy qua.
  public playWheelTick(progressRatio = 0.5) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = "sine";
    const baseFreq = 520 + progressRatio * 260;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.028);

    env.gain.setValueAtTime(0.045, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Tiếng chuông ngân nhẹ khi vòng số dừng đúng vào ngày sinh nhật.
  public playDateLockChime() {
    this.playPianoNote(523.25, 1.8, 0.09, 0);
    this.playPianoNote(659.25, 1.9, 0.08, 0.07);
    this.playPianoNote(783.99, 2.3, 0.085, 0.14);
  }

  // Bắt đầu tiếng đánh lửa & tiếng ngọn lửa nến reo ấm khi nhấn giữ vào bánh kem.
  public startCandleIgnite() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    this.stopCandleFlame();

    // Tạo luồng nhiễu hồng giả lập luồng khí nóng quanh ngọn lửa nến.
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const out = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      out[i] = (b0 + b1 + b2 + white * 0.015) * 0.45;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 260;
    filter.Q.value = 0.85;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.25);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.flameNoiseSource = src;
    this.flameFilter = filter;
    this.flameGain = gain;
  }

  // Cập nhật độ ấm và độ lớn của tiếng lửa theo phần trăm nhấn giữ (từ 0 đến 1 trong 3 giây).
  public updateCandleFlame(progress: number) {
    if (!this.ctx || !this.flameFilter || !this.flameGain) return;
    const now = this.ctx.currentTime;
    this.flameFilter.frequency.setTargetAtTime(240 + progress * 340, now, 0.08);
    this.flameGain.gain.setTargetAtTime(0.04 + progress * 0.12, now, 0.08);
  }

  // Tắt tiếng lửa cháy êm ái khi người dùng nhả tay hoặc chuyển màn.
  public stopCandleFlame() {
    if (this.ctx && this.flameGain && this.flameNoiseSource) {
      const now = this.ctx.currentTime;
      const oldSrc = this.flameNoiseSource;
      this.flameGain.gain.setTargetAtTime(0.0001, now, 0.08);
      window.setTimeout(() => {
        try {
          oldSrc.stop();
        } catch {
          // Bỏ qua nếu bộ phát đã tự dừng trước đó.
        }
      }, 220);
    }
    this.flameNoiseSource = null;
    this.flameFilter = null;
    this.flameGain = null;
  }

  // Hợp âm lung linh vang lên khi nến đạt độ cháy rực rỡ nhất sau 3 giây.
  public playCandleFullBloom() {
    this.stopCandleFlame();
    this.playPianoNote(349.23, 2.4, 0.09, 0);
    this.playPianoNote(440.0, 2.4, 0.085, 0.06);
    this.playPianoNote(523.25, 2.6, 0.09, 0.12);
    this.playPianoNote(698.46, 3.0, 0.095, 0.2);
  }

  // Tiếng chuông gió trong trẻo khi chọn mở 1 trong 4 phong thư điều ước.
  public playWishSelect() {
    this.playPaperOpen();
    this.playPianoNote(587.33, 1.8, 0.075, 0.05);
    this.playPianoNote(880.0, 2.1, 0.07, 0.13);
  }

  // Tiếng kết tinh phép màu khi bức thư/điều ước thu mình biến thành ngôi sao sáng.
  public playWishToStar() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      this.playPianoNote(freq, 2.2, 0.07, i * 0.075);
    });
  }

  // Tiếng sao băng vút bay vào bầu trời đêm khi người nhận chạm tay vào ngôi sao.
  public playStarAscend() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    // Lớp gió không gian vút nhẹ lên cao.
    const dur = 2.4;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const p = i / len;
      const env = Math.sin(Math.min(1, p * 1.4) * Math.PI) * Math.pow(1 - p, 1.2);
      ch[i] = (Math.random() * 2 - 1) * env * 0.18;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2.2;
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 1.5);
    filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + dur);

    src.connect(filter);
    filter.connect(this.masterGain);
    src.start();

    // Chuỗi nốt lấp lánh bay xa dần trong dải Ngân Hà.
    const sparkleNotes = [698.46, 880, 1046.5, 1396.91, 1760];
    sparkleNotes.forEach((f, idx) => {
      this.playPianoNote(f, 2.6, Math.max(0.035, 0.085 - idx * 0.011), idx * 0.16);
    });
  }
}

// Xuất ra một thực thể duy nhất dùng chung xuyên suốt các màn hình của thiệp.
export const soundEngine = new CinemaSoundEngine();
