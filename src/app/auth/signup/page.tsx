import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-8">
      <Card className="w-full max-w-md border-zinc-200 shadow-lg dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Save events and pick up where you left off on any device.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already registered?{" "}
            <Link href="/auth/signin" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
