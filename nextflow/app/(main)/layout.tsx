"use client";

import GlobalSidebar from "@/components/sidebar/GlobalSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#0a0a09] overflow-hidden">
      <GlobalSidebar />
      <main className="flex-1 h-full overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
