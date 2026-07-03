import { useCallback, useRef, useState } from "react";
import "./Dropzone.css";

const ACCEPT =
  ".pdf,.doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.ods,.ppt,.pptx,.odp,.jpg,.jpeg,.png";

export default function Dropzone({ onFiles, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      className={`dropzone ${dragging ? "dropzone--active" : ""} ${disabled ? "dropzone--disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <svg className="dropzone__icon" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M20 6v18m0-18 6 6m-6-6-6 6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 25v4a4 4 0 0 0 4 4h18a4 4 0 0 0 4-4v-4"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="dropzone__title">Drop files here or tap to browse</p>
      <p className="dropzone__hint">PDF, Word, Excel, PowerPoint, JPG, PNG — up to 30MB each</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={disabled}
        className="dropzone__input"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
