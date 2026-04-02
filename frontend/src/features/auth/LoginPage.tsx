import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthCard } from "./AuthCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

// ── Validation Schema —————
// Zod v4 syntax: z.email() — NOT z.string().email() (that is Zod v3).
const LoginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// z.infer<> derives the TypeScript type from the Zod schema.
// note: you don't need to declare a separate interface for form field types.
type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ProtectedRoute stores the original destination in location.state.from.
  // The ?. chain handles the case where the user navigated to /login directly
  // (no state) — falls back to /dashboard.
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/dashboard";

  // useForm wires React Hook Form with the Zod resolver.
  // register() — connects an input to the form (name, onChange, onBlur, ref)
  // handleSubmit() — calls onSubmit only if validation passes
  // formState.errors — per-field error messages from Zod
  // formState.isSubmitting — true while onSubmit is awaiting
  // setError() — manually adds an error (used for server/Cognito errors)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginValues) => {
    try {
      // login() calls Amplify Auth.signIn(email, password) internally.
      // On success, Amplify stores the JWT tokens in memory/localStorage.
      await login(data.email, data.password);
      // If redirected from a protected route, honour that destination.
      // Otherwise send admins to /admin and clients to /dashboard.
      if (from !== "/dashboard") {
        navigate(from, { replace: true });
      } else {
        navigate(user?.isAdmin ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Login failed";
      setError("root", { message });
    }
  };

  return (
    <AuthCard title="Sign in to ClientFlow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Root-level (server) error — shown below fields */}
        {errors.root && (
          <p className="text-sm text-red-600">{errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
