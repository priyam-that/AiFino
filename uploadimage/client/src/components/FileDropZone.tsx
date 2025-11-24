import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

type Props = {
  onFileSelected: (file: File) => void;
};

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

export function FileDropZone({ onFileSelected }: Props) {
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
    [onFileSelected],
  );

  return (
    <div
      className={`drop-zone ${isOver ? "drop-zone--active" : ""}`}
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
        style={{ display: "none" }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
      />
      <p>Drag & drop a receipt, or click to browse.</p>
      <small>PNG · JPG · PDF up to 10 MB</small>
    </div>
  );
}
