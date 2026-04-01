// Handles Cognito email verification.
// After sign up, Cognito sends a 6-digit numeric code to the user's email.
// This page collects the code and calls confirmEmail() from useAuth.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthCard } from "./AuthCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const ConfirmSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

type ConfirmValues = z.infer<typeof ConfirmSchema>;

export default function ConfirmEmailPage() {
  const { confirmEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Email passed via navigation state from SignUpPage.
  // Falls back to empty string if user navigated here directly (e.g. browser refresh).
  const email = (location.state as { email?: string })?.email ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ConfirmValues>({ resolver: zodResolver(ConfirmSchema) });

  const onSubmit = async (data: ConfirmValues) => {
    try {
      // confirmEmail calls Amplify Auth.confirmSignUp(email, code).
      await confirmEmail(email, data.code);

      // Account is now confirmed. Navigate to login.
      // Pass confirmed: true so LoginPage can show a "Account confirmed!" message.
      navigate("/login", { state: { confirmed: true } });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Confirmation failed";
      setError("root", { message });
    }
  };

  return (
    <AuthCard title="Confirm your email">
      <p className="text-sm text-gray-600 mb-4">
        We sent a 6-digit code to {email || "your email"}. Enter it below.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Confirmation code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          error={errors.code?.message}
          {...register("code")}
        />
        {errors.root && (
          <p className="text-sm text-red-600">{errors.root.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Confirming..." : "Confirm email"}
        </Button>
      </form>
    </AuthCard>
  );
}
