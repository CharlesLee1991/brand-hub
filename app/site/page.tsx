import { Suspense } from "react";
import SiteContent from "./SiteContent";

export default function SitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SiteContent />
    </Suspense>
  );
}
