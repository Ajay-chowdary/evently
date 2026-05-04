"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  async function handleGoogleSignUp() {
    setError(null);
    setGooglePending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (oauthError) {
        setError(oauthError.message || "Unable to sign up with Google.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in is not configured yet.");
    } finally {
      setGooglePending(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Unable to create your account.");
        return;
      }

      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }

      setSuccess("Account created. Check your email to verify your address, then sign in.");
      form.reset();
    } catch {
      setError("Supabase auth is not configured yet.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl border-zinc-300 dark:border-zinc-700"
        disabled={googlePending}
        onClick={handleGoogleSignUp}
      >
        <GoogleIcon className="mr-2 h-5 w-5" />
        {googlePending ? "Redirecting..." : "Continue with Google"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            or
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" type="text" autoComplete="name" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">At least 8 characters</p>
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            {success}
          </p>
        ) : null}
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
