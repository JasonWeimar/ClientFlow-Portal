// ——— frontend / src / features / requests / SubmitRequestPage.tsx; ———
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RequestFormSchema, RequestFormValues } from "./requestSchema";
import { apiClient } from "../../lib/apiClient";
import { uploadFile } from "../../services/upload.service";

export default function SubmitRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // useForm initializes form state. zodResolver connects our Zod schema
  // to react-hook-form's validation system. On submit, values are already
  // type-safe and validated — no need for manual if/else checks.
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(RequestFormSchema),
    defaultValues: {
      serviceType: "",
      description: "",
      preferredDate: "",
      attachmentKey: null,
    },
  });

  // useMutation wraps an async operation (the POST /requests API call).
  // It tracks loading/error/success state without any useState boilerplate.
  const mutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const response = await apiClient.post("/requests", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the 'requests' query cache — forces a fresh fetch on the dashboard.
      // This ensures the newly created request appears immediately after redirect.
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      navigate("/dashboard");
    },
  });

  // handleFileChange: called when user selects a file.
  // Triggers the 2-step upload: get pre-signed URL, then PUT to S3.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // uploadFile is in services/upload.service.ts (Step 14.3)
      const objectKey = await uploadFile(file);
      // Store the S3 key in the form — not the file object or the signed URL.
      setValue("attachmentKey", objectKey, { shouldValidate: true });
    } catch {
      alert("File upload failed. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">
        Submit a Service Request
      </h1>
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-6"
      >
        {/* Service Type Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Service Type
          </label>
          <select
            {...register("serviceType")}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select a service...</option>
            <option value="Consulting">Consulting</option>
            <option value="Design">Design</option>
            <option value="Development">Development</option>
            <option value="Support">Support</option>
          </select>
          {errors.serviceType && (
            <p className="text-red-600 text-xs mt-1">
              {errors.serviceType.message}
            </p>
          )}
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={5}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Describe what you need in detail..."
          />
          {errors.description && (
            <p className="text-red-600 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Attachment (optional)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2
                            file:px-4 file:rounded-md file:border-0 file:text-sm
                            file:font-medium file:bg-brand-50 file:text-brand-700"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="w-full bg-brand-600 text-white rounded-md py-2.5 text-sm
                           font-medium hover:bg-brand-700 disabled:opacity-50
                           transition-colors"
        >
          {mutation.isPending ? "Submitting..." : "Submit Request"}
        </button>

        {/* Global error from the mutation */}
        {mutation.isError && (
          <p className="text-red-600 text-sm text-center">
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
