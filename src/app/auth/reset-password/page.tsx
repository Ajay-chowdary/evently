"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/signin`,
      });

      if (resetError) {
        setError(resetError.message || "Unable to send reset email.");
        return;
      }

      setMessage("Reset instructions sent. Check your inbox for the secure link.");
    } catch {
      setError("Supabase auth is not configured yet.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-8">
      <Card className="w-full max-w-md border-zinc-200 shadow-lg dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Send yourself a secure reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                {message}
              </p>
            ) : null}
            <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
              {pending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Remembered your password?{" "}
            <Link href="/auth/signin" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
