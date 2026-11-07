"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cardConfig, wishes, type WishItem } from "./card-config";
import CinemaAtmosphere from "./components/CinemaAtmosphere";
import DateWheelStage from "./components/DateWheelStage";
import HandwrittenLetterStage from "./components/HandwrittenLetterStage";
import HeartResultStage from "./components/HeartResultStage";
import IntroStage from "./components/IntroStage";
import RealisticCakeStage from "./components/RealisticCakeStage";
import { soundEngine } from "./components/SoundEngine";
import StarSkyFinale from "./components/StarSkyFinale";
import ThoughtsStage from "./components/ThoughtsStage";
import WishEnvelopesStage from "./components/WishEnvelopesStage";

// ============================================================================
// TRANG ĐIỀU PHỐI CHÍNH CỦA THIỆP SINH NHẬT HOÀNG KIM — MỆNH KIM (page.tsx)
// Luồng trải nghiệm 8 phân cảnh liền mạch như một bộ phim tương tác quay bằng DSLR:
// 1. intro     : Mật thư Ấn Sáp Vàng 24K phong cách Harry Potter dưới ánh nến để kích hoạt nhạc.
// 2. dateWheel : Vòng Số Chạy Dọc Đến Ngày Sinh Nhật trên nền bokeh vàng hoàng kim.
// 3. cake      : Bánh kem chụp thật từ DSLR & 6 cây nến hoàng kim/bạch kim nhấn giữ 3 giây.
// 4. thoughts  : Từng câu tâm sự lấy nét quang học hiện rõ rồi tan mờ mượt mà (~16 giây).
// 5. wishes    : 4 phong thư cổ niêm phong Ấn Sáp Vàng (Công việc, Tình yêu, Sức khỏe, Tinh thần).
// 6. result    : Lời chúc tương ứng + Trái tim 46 tấm ảnh tông vàng sâm panh + Album Polaroid 35mm.
// 7. letter    : Tờ giấy sợi bông xé viền kẹp ghim đồng vàng + Mực viết tay hiện mượt 10 giây.
// 8. finale    : Thiệp nhũ vàng 24K -> Hóa thành 1 ngôi sao -> Chạm vào ngôi sao bay lên Ngân Hà.
// ============================================================================

type CardStage =
  | "intro"
  | "dateWheel"
  | "cake"
  | "thoughts"
  | "wishes"
  | "result"
  | "letter"
  | "finale";

// Hàm đăng ký rỗng phục vụ đọc tham số thanh địa chỉ trình duyệt chuẩn React 19.
function subscribeLocationSearch() {
  return () => {};
}

export default function BirthdayCardPage() {
  // Mở đường dẫn (link) sẽ hiện Trang Mở Đầu Ấn Sáp Vàng trước tiên để bật nhạc mượt mà.
  const [stage, setStage] = useState<CardStage>("intro");
  const [runKey, setRunKey] = useState(0);

  // Đọc chuỗi truy vấn trên URL phía trình duyệt (ví dụ: ?to=Lan&from=Minh&day=17&month=7).
  const searchString = useSyncExternalStore(
    subscribeLocationSearch,
    () => window.location.search,
    () => ""
  );

  const { recipient, sender, birthdayDay, birthdayMonth } = useMemo(() => {
    const params = new URLSearchParams(searchString);
    const toParam = params.get("to")?.trim();
    const fromParam = params.get("from")?.trim();
    const dayParam = Number(params.get("day"));
    const monthParam = Number(params.get("month"));

    return {
      recipient: toParam || cardConfig.recipient,
      sender: fromParam || cardConfig.sender,
      birthdayDay:
        Number.isFinite(dayParam) && dayParam >= 1 && dayParam <= 31
          ? dayParam
          : cardConfig.birthdayDay,
      birthdayMonth:
        Number.isFinite(monthParam) && monthParam >= 1 && monthParam <= 12
          ? monthParam
          : cardConfig.birthdayMonth,
    };
  }, [searchString]);

  const [selectedWishId, setSelectedWishId] = useState<WishItem["id"]>("work");
  const [soundPlaying, setSoundPlaying] = useState(false);
  const userMutedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Khởi chạy nhạc nền (file MP3 tùy chỉnh hoặc bản phối Piano & Hộp nhạc ấm áp)
  // ngay trong thao tác chạm mở ấn sáp của người nhận để trình duyệt cho phép phát 100%.
  const startBackgroundMusic = useCallback(() => {
    if (userMutedRef.current) return;
    soundEngine.setMuted(false);
    setSoundPlaying(true);

    if (cardConfig.musicSrc && audioRef.current) {
      void audioRef.current.play().catch(() => {
        soundEngine.startAmbientBirthdayMusic();
      });
    } else {
      soundEngine.startAmbientBirthdayMusic();
    }
  }, []);

  // Nút bật/tắt âm thanh chủ động ở góc phải thanh điều hướng trên cùng.
  const handleToggleSound = () => {
    if (soundPlaying) {
      userMutedRef.current = true;
      soundEngine.setMuted(true);
      if (audioRef.current) audioRef.current.pause();
      setSoundPlaying(false);
    } else {
      userMutedRef.current = false;
      soundEngine.setMuted(false);
      if (cardConfig.musicSrc && audioRef.current) {
        void audioRef.current.play().catch(() => {
          soundEngine.startAmbientBirthdayMusic();
        });
      } else {
        soundEngine.startAmbientBirthdayMusic();
      }
      setSoundPlaying(true);
    }
  };

  // Đặt lại hành trình quay về Trang Mở Đầu Mật Thư Ấn Sáp Vàng (giữ nhạc nền tiếp tục ngân vang).
  const handleRestart = () => {
    soundEngine.stopCandleFlame();
    setRunKey((prev) => prev + 1);
    setStage("intro");
    if (!userMutedRef.current) {
      startBackgroundMusic();
    }
  };

  const selectedWish =
    wishes.find((item) => item.id === selectedWishId) ?? wishes[0];

  const enablePetals = stage === "result" || stage === "finale";

  return (
    <main className="cinema-card-root" data-stage={stage}>
      {/* Quầng sáng môi trường Vàng Hoàng Kim ấm áp cực dịu (tự tắt hoàn toàn ở cảnh bánh kem phòng tối) */}
      <div className="cinema-ambient-glow glow-warm-key" aria-hidden="true" />
      <div className="cinema-ambient-glow glow-amber" aria-hidden="true" />

      {/* Không gian ống kính DSLR 50mm f/1.4: ảnh bokeh thật + cánh hoa vàng sâm panh 3 tầng tiêu cự */}
      <CinemaAtmosphere
        enablePetals={enablePetals}
        darkroomMode={stage === "cake"}
        subtleMode={stage === "finale" || stage === "intro"}
        bokehPhotoUrl={cardConfig.cinemaBokehImage}
      />

      {/* Thanh điều hướng tối giản ánh vàng kim phía trên */}
      <header className="cinema-topbar">
        <span className="cinema-brand-mark">
          <i aria-hidden="true">✦</i> GỬI {recipient.toUpperCase()}
        </span>

        <button
          type="button"
          className="cinema-sound-toggle"
          onClick={handleToggleSound}
          aria-label={soundPlaying ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          <span className={`sound-equalizer ${soundPlaying ? "playing" : ""}`}>
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>{soundPlaying ? "Nhạc đang phát" : "Bật nhạc"}</span>
        </button>
      </header>

      {/* Khung sân khấu chính hiển thị từng phân cảnh điện ảnh */}
      <section className="cinema-stage-container" aria-live="polite">
        {/* MÀN MỞ ĐẦU: Mật thư Ấn Sáp Vàng 24K phong cách Harry Potter để bật nhạc & mở thiệp */}
        {stage === "intro" && (
          <IntroStage
            key={`intro-${runKey}`}
            recipient={recipient}
            sender={sender}
            onUnlockAudio={startBackgroundMusic}
            onComplete={() => setStage("dateWheel")}
          />
        )}

        {/* MÀN 2: Vòng số chạy dọc đến đúng ngày tháng sinh nhật */}
        {stage === "dateWheel" && (
          <DateWheelStage
            key={`wheel-${runKey}`}
            birthdayDay={birthdayDay}
            birthdayMonth={birthdayMonth}
            onComplete={() => setStage("cake")}
          />
        )}

        {/* MÀN 3: Bánh kem chụp thật từ DSLR & 6 ngọn lửa nến nhấn giữ 3 giây */}
        {stage === "cake" && (
          <RealisticCakeStage
            key={`cake-${runKey}`}
            onComplete={() => setStage("thoughts")}
          />
        )}

        {/* MÀN 4: Từng câu tâm sự hiện rõ rồi tan mờ mượt mà */}
        {stage === "thoughts" && (
          <ThoughtsStage
            key={`thoughts-${runKey}`}
            thoughts={cardConfig.thoughts}
            onComplete={() => setStage("wishes")}
          />
        )}

        {/* MÀN 5: Bốn phong thư cổ niêm phong Ấn Sáp Vàng 24K */}
        {stage === "wishes" && (
          <WishEnvelopesStage
            wishes={wishes}
            recipient={recipient}
            onSelectWish={(id) => {
              setSelectedWishId(id);
              setStage("result");
            }}
          />
        )}

        {/* MÀN 6: Lời chúc chi tiết + Trái tim ghép 46 tấm ảnh ánh vàng + Album Polaroid 35mm */}
        {stage === "result" && (
          <HeartResultStage
            selectedWish={selectedWish}
            recipient={recipient}
            photos={cardConfig.photos}
            photoCaptions={cardConfig.photoCaptions}
            onOpenLetter={() => setStage("letter")}
            onChooseAnotherWish={() => setStage("wishes")}
          />
        )}

        {/* MÀN 7: Tờ giấy sợi bông xé viền kẹp ảnh Polaroid + Chữ viết tay 10 giây */}
        {stage === "letter" && (
          <HandwrittenLetterStage
            key={`letter-${runKey}`}
            letterText={cardConfig.letter}
            recipient={recipient}
            sender={sender}
            polaroidPhotoUrl={cardConfig.letterPolaroidPhoto}
            onContinue={() => setStage("finale")}
          />
        )}

        {/* MÀN 8: Khung thiệp nhũ vàng -> Hóa thành 1 ngôi sao -> Chạm sao bay vào dải Ngân Hà */}
        {stage === "finale" && (
          <StarSkyFinale
            key={`finale-${runKey}`}
            recipient={recipient}
            sender={sender}
            wishTitle={selectedWish.title}
            finalBlessing={cardConfig.finalBlessing}
            nightSkyImageUrl={cardConfig.nightSkyImage}
            onRestart={handleRestart}
          />
        )}
      </section>

      {cardConfig.musicSrc && (
        <audio ref={audioRef} src={cardConfig.musicSrc} loop preload="auto" />
      )}
    </main>
  );
}
