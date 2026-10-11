import { useEffect, useState } from "react";
import logo from "@/assets/patrion-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export type LogoState = "idle" | "intro" | "loading" | "busy";

interface Props {
  size?: number;
  state?: LogoState;
  className?: string;
  onClick?: () => void;
  label?: string;
}

/** The PATRION symbol, with lightweight state-driven animations. */
export function PatrionLogo({ size = 40, state = "idle", className, onClick, label = "Patrion" }: Props) {
  const [tap, setTap] = useState(0);
  useEffect(() => {
    if (!tap) return;
    const t = setTimeout(() => setTap(0), 450);
    return () => clearTimeout(t);
  }, [tap]);

  const anim =
    tap > 0
      ? "animate-logo-tap"
      : state === "intro"
        ? "animate-logo-in"
        : state === "loading"
          ? "animate-logo-spin"
          : state === "busy"
            ? "animate-logo-pulse"
            : "";

  const img = (
    <img
      src={logo.url}
      alt={label}
      width={size}
      height={size}
      draggable={false}
      className={cn("rounded-full object-cover select-none", anim)}
      style={{ width: size, height: size }}
    />
  );

  if (!onClick) return <span className={cn("inline-flex shrink-0", className)}>{img}</span>;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        setTap((n) => n + 1);
        onClick();
      }}
      className={cn("inline-flex shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-primary", className)}
    >
      {img}
    </button>
  );
}

export function SplashScreen({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background">
      <PatrionLogo size={96} state="intro" />
      <p className="font-display text-2xl text-gold-gradient animate-fade-up">PATRION</p>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
