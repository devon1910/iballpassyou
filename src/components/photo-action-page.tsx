import Image from "next/image";
import type { ReactNode } from "react";

type PhotoActionPageProps = {
  children: ReactNode;
};

export function PhotoActionPage({ children }: PhotoActionPageProps) {
  return (
    <main className="photo-action-page">
      <Image
        aria-hidden="true"
        alt=""
        className="photo-action-image"
        fill
        priority
        sizes="100vw"
        src="/brand/footy-in-action.jpeg"
      />
      <div aria-hidden="true" className="photo-action-shade" />
      <div className="shell photo-action-content">{children}</div>
    </main>
  );
}
