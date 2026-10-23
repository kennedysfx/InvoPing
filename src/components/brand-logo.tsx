import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  variant?: "light" | "dark";
  iconOnly?: boolean;
  className?: string;
};

export default function BrandLogo({
  href = "/",
  variant = "light",
  iconOnly = false,
  className = "",
}: BrandLogoProps) {
  const onDarkBackground = variant === "dark";

  return (
    <Link
      href={href}
      aria-label="InvoPing home"
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#079333] ${className}`}
    >
      <Image
        src="/brand/invoping-icon.svg"
        alt=""
        width={36}
        height={36}
        className={`h-9 w-9 shrink-0 ${
          onDarkBackground ? "brightness-0 invert" : ""
        }`}
      />

      {!iconOnly && (
        <span
          className={`text-[25px] font-bold leading-none tracking-[-0.045em] ${
            onDarkBackground ? "text-white" : "text-[#064b32]"
          }`}
        >
          InvoPing
        </span>
      )}
    </Link>
  );
}