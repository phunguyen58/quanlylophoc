"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Home, UsersRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function AppShell({ children, fullName }: { children: React.ReactNode; fullName: string }) {
  const pathname = usePathname();
  const classId = pathname.match(/^\/classes\/([^/]+)/)?.[1];
  const navigation = classId
    ? [{ href: "/dashboard", icon: Home, label: "Trang chủ" }, { href: `/classes/${classId}/students`, icon: UsersRound, label: "Học sinh" }, { href: `/classes/${classId}/session`, icon: CalendarDays, label: "Buổi học" }, { href: `/classes/${classId}/reports`, icon: BarChart3, label: "Báo cáo" }]
    : [{ href: "/dashboard", icon: Home, label: "Trang chủ" }];
  return <div className="min-h-screen bg-slate-50"><aside className="fixed inset-y-0 hidden w-56 border-r bg-card p-4 md:flex md:flex-col"><Link className="mb-6 text-lg font-bold text-primary" href="/dashboard">QLLH</Link><nav aria-label="Điều hướng chính" className="space-y-0.5">{navigation.map(({ href, icon: Icon, label }) => <Link className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium hover:bg-sky-50 hover:text-primary" href={href} key={label}><Icon aria-hidden="true" className="size-4" />{label}</Link>)}</nav><div className="mt-auto rounded-lg bg-sky-50 p-2.5"><p className="text-sm font-semibold">{fullName}</p><form action={logout}><Button className="mt-1 h-7 px-0 text-muted-foreground" size="sm" type="submit" variant="ghost">Đăng xuất</Button></form></div></aside><main className="mx-auto min-h-screen max-w-5xl px-3 pb-20 pt-4 md:ml-56 md:max-w-none md:px-6 md:py-6">{children}</main><nav aria-label="Điều hướng di động" className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-card px-0.5 py-0.5 shadow-lg md:hidden">{navigation.map(({ href, icon: Icon, label }) => <Link className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-primary" href={href} key={label}><Icon aria-hidden="true" className="size-4" /><span className="truncate">{label}</span></Link>)}</nav></div>;
}
