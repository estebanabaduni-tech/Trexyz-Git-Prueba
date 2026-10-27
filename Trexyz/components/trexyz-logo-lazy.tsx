"use client";

import dynamic from "next/dynamic";

const TrexyzLogo = dynamic(() => import("@/components/trexyz-logo"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-2xl font-bold tracking-widest text-sky-200/60">
      TREXYZ
    </div>
  ),
});

export default TrexyzLogo;
