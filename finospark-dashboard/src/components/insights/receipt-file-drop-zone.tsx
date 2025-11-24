"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

type Props = {
  onFileSelected: (file: File) => void;
};

export function ReceiptFileDropZone({ onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }
      const file = files[0];
      if (ACCEPTED_TYPES.includes(file.type)) {
        onFileSelected(file);
      } else {
        alert("Unsupported file type. Please upload PNG, JPG, or PDF.");
      }
    },
    [onFileSelected]
  );

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed transition-all ${
        isOver
          ? "border-[#2CFF75] bg-[#2CFF75]/10"
          : "border-white/20 bg-black/40 hover:border-white/40"
      }`}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsOver(false);
        handleFiles(event.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
      />
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Upload className="size-8 text-[#2CFF75]" />
        <div>
          <p className="text-sm font-medium text-white">
            Beam a receipt to Spark
          </p>
          <p className="mt-1 text-xs text-white/60">
            Drag & drop or click to browse
          </p>
        </div>
        <p className="text-xs text-white/40">PNG · JPG · PDF up to 10 MB</p>
      </div>
    </div>
  );
}

