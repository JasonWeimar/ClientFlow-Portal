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
  const { login } = useAuth();
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
      // login() now returns the user object directly after Amplify resolves.
      // Is captured in loggedInUser instead of relying on the user variable
      // from useAuth() — because React state updates (like setting user in the
      // auth context) are asynchronous. By the time the next line runs, the
      // user variable from useAuth() still holds the OLD value (null/undefined).
      // loggedInUser gives us the freshly resolved value immediately.
      const loggedInUser = await login(data.email, data.password);

      // If the user was redirected here from a protected route (e.g. they tried
      // to visit /dashboard while logged out), ProtectedRoute stored that
      // original destination in location.state.from. Honor it and send them
      // back there instead of making a routing decision.
      // from defaults to "/dashboard" (set above), so this condition is only
      // true when a real redirect happened — e.g. from === "/admin/requests/123"
      if (from !== "/dashboard") {
        navigate(from, { replace: true });
      } else {
        // No prior redirect — make the routing decision based on role.
        // loggedInUser is used here (not user from useAuth) because user is still
        // stale at this point in the render cycle.
        // replace: true replaces the /login entry in browser history so the
        // user can't hit the back button and land on /login again after signing in.
        navigate(loggedInUser?.isAdmin ? "/admin" : "/dashboard", {
          replace: true,
        });
      }
    } catch (e: unknown) {
      // Amplify throws Error objects on bad credentials, network failures, etc.
      // We narrow the type with instanceof before reading .message — TypeScript
      // types caught values as unknown (not Error) so we can't assume .message exists.
      const message = e instanceof Error ? e.message : "Login failed";

      // setError("root") attaches an error to the form that isn't tied to any
      // specific field — used for server-side/API errors like wrong password.
      // This surfaces as errors.root in the JSX below the form fields.
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
