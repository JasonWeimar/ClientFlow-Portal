import { useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUploadZone({
  onFileSelect,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  className,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB`);
      return;
    }
    setUploadedName(file.name);
    onFileSelect(file);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          "w-full rounded-lg border-2 border-dashed px-4 py-8",
          "cursor-pointer transition-colors duration-150 text-center",
          isDragging
            ? "border-brand-500 bg-brand-50"
            : uploadedName
              ? "border-status-approved bg-status-approved-bg"
              : error
                ? "border-status-rejected bg-status-rejected-bg"
                : "border-slate-300 bg-white hover:border-brand-500 hover:bg-brand-50",
          className,
        )}
      >
        <span className="text-2xl">
          {uploadedName ? "✅" : error ? "⚠️" : "📎"}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-slate-700">
            {uploadedName ?? "Click or drag a file to upload"}
          </span>
          <span className="text-xs text-slate-400">
            {uploadedName
              ? "Click to replace"
              : `${accept.replace(/,/g, " ")} · Max ${maxSizeMB}MB`}
          </span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && (
        <p className="text-xs text-status-rejected flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
