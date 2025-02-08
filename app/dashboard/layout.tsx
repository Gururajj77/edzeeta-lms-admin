// app/dashboard/layout.tsx
import { DashboardNav } from "@/app/comps/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <DashboardNav />
      <main className="md:pl-64 pb-16 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
