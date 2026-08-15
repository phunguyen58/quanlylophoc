"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return <form action={formAction} className="space-y-5" noValidate>
    <input type="hidden" name="next" value={next ?? ""} />
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input autoComplete="email" id="email" name="email" placeholder="co.lan@truong.edu.vn" required type="email" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Mật khẩu</Label>
      <Input autoComplete="current-password" id="password" name="password" required type="password" />
    </div>
    {state.error && <p aria-live="polite" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button className="h-12 w-full text-base" disabled={pending} type="submit">
      {pending ? "Đang đăng nhập…" : "Đăng nhập"}
    </Button>
  </form>;
}
