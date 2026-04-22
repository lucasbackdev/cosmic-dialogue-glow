import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";

const BrandLogo = () => {
  return (
    <div className="hidden md:flex fixed top-3 left-16 md:top-4 md:left-16 z-30 items-center gap-2 pointer-events-none select-none">
      {/* Light mode: black logo */}
      <img
        src={logoBlack}
        alt="KahlChat"
        className="w-7 h-7 md:w-8 md:h-8 object-contain block dark:hidden"
      />
      {/* Dark mode: white logo */}
      <img
        src={logoWhite}
        alt="KahlChat"
        className="w-7 h-7 md:w-8 md:h-8 object-contain hidden dark:block"
      />
      <span className="text-foreground text-base md:text-lg font-semibold tracking-tight">
        KahlChat
      </span>
    </div>
  );
};

export default BrandLogo;
