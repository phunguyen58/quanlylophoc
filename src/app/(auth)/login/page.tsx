import { BookOpenCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const returnPath =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : undefined;

  return <main className="flex min-h-screen items-center justify-center bg-sky-50 px-5 py-10">
    <section className="w-full max-w-md rounded-3xl bg-card p-7 shadow-sm ring-1 ring-sky-100 sm:p-9">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><BookOpenCheck aria-hidden="true" /></div>
        <div><p className="text-xl font-bold">QLLH</p><p className="text-sm text-muted-foreground">Quản lý lớp học thật nhẹ nhàng</p></div>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Chào cô/thầy 👋</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Đăng nhập để mở lớp học của mình.</p>
      <LoginForm next={returnPath} />
    </section>
  </main>;
}
