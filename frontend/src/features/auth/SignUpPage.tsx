import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthCard } from "./AuthCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const SignUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Error appears under the confirmPassword field
  });

type SignUpValues = z.infer<typeof SignUpSchema>;

export default function SignUpPage() {
  // note: rename register to registerUser to avoid conflict with RHF's register function.
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpValues>({ resolver: zodResolver(SignUpSchema) });

  const onSubmit = async (data: SignUpValues) => {
    try {
      // registerUser calls Amplify Auth.signUp(email, password).
      // Cognito sends a 6-digit code to the email address.
      await registerUser(data.email, data.password);

      // Pass email via navigation state to avoid retyping on confirmation page.
      navigate("/confirm-email", { state: { email: data.email } });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign up failed";
      setError("root", { message });
    }
  };

  return (
    <AuthCard title="Create your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {errors.root && (
          <p className="text-sm text-red-600">{errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
