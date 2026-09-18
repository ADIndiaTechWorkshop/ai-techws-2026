import Link from "next/link";
import { Shell } from "@/components/chrome/Shell";
import { login, register } from "@/app/actions/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const { mode, error } = await searchParams;
  const isRegister = mode === "register";

  const errorMessage =
    error === "invalid"
      ? "Invalid email or password."
      : error === "exists"
        ? "An account with this email already exists."
        : error === "weak"
          ? "Use a valid email and password (at least 8 characters)."
          : null;

  return (
    <Shell>
      <div className="mx-auto flex max-w-[1440px] justify-center px-12 py-16">
        <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-ink">
            {isRegister ? "Register" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isRegister
              ? "Create a buyer account to save orders and addresses."
              : "Sign in with your email and password."}
          </p>

          {errorMessage ? (
            <p className="mt-4 rounded-md border border-line bg-canvas px-3 py-2 text-sm text-navy">
              {errorMessage}
            </p>
          ) : null}

          <form
            className="mt-6 flex flex-col gap-4"
            action={isRegister ? register : login}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="rounded-md border border-line bg-surface px-4 py-2.5 font-normal text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Password
              <input
                type="password"
                name="password"
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="rounded-md border border-line bg-surface px-4 py-2.5 font-normal text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
            >
              {isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isRegister ? "Already have an account?" : "New to AppStore?"}{" "}
            <Link
              href={isRegister ? "/signin" : "/signin?mode=register"}
              className="font-medium text-navy hover:underline"
            >
              {isRegister ? "Sign in" : "Register"}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
