import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function FormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-11 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-11 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-11 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="mx-auto flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-8">
      <Card className="w-full max-w-md border-zinc-200 shadow-lg dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Welcome back. Use your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormFallback />}>
            <SignInForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            New here?{" "}
            <Link href="/auth/signup" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
