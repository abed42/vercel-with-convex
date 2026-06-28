"use client";

import { useRouter } from "next/navigation";
import { TopNav } from "@/components/board/TopNav";
import { Story } from "@/components/board/Story";

export default function AiHackathonPage() {
  const router = useRouter();
  return (
    <>
      <TopNav />
      <Story onPivot={() => router.push("/")} />
    </>
  );
}
