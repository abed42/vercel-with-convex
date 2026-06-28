"use client";

import { useRouter } from "next/navigation";
import { Ticker } from "@/components/board/Ticker";
import { Board } from "@/components/board/Board";

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Ticker />
      <Board onColdOpen={() => router.push("/ai-hackathon")} />
    </>
  );
}
