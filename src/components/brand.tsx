import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function Brand({ compact = false, hero = false }: { compact?: boolean; hero?: boolean }) {
  const src = compact ? "/brand/icon-lime.svg" : "/brand/wordmark-dark.svg";
  return <Link href="/" className={`brand ${hero ? "brand-hero" : ""}`} aria-label={`${APP_NAME} home`}>
    <Image src={src} width={compact ? 44 : 250} height={compact ? 44 : 64} alt={APP_NAME} priority={hero} />
  </Link>;
}
