import type { Metadata } from "next";
import { NowView } from "@/components/now/now-view";

export const metadata: Metadata = { title: "What to do now" };

export default function NowPage() {
  return <NowView />;
}
