import type { Metadata } from "next";
import { NoticeView } from "@/components/now/notice-view";

export const metadata: Metadata = { title: "Your written notice" };

export default function NoticePage() {
  return <NoticeView />;
}
