import { useEffect, useRef } from "react";

// Six single-digit boxes with auto-advance, backspace, arrow keys and paste support.
// `value` is a plain string of up to `length` digits.
export default function OtpInput({ value, onChange, length = 6, disabled = false, autoFocus = false, hasError = false }) {
  const refs = useRef([]);
  const focusBox = (i) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  useEffect(() => {
    if (autoFocus) focusBox(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // After the parent clears the code (e.g. a wrong attempt), jump back to the first box.
  useEffect(() => {
    if (value === "" && document.activeElement && refs.current.includes(document.activeElement)) focusBox(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(i, e) {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) return;
    // Digits are always entered left to right, so insert at the end of what's already typed.
    const next = (value.slice(0, Math.min(i, value.length)) + digits).slice(0, length);
    onChange(next);
    focusBox(next.length);
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") focusBox(i - 1);
    else if (e.key === "ArrowRight") focusBox(i + 1);
  }

  function handlePaste(e) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    focusBox(digits.length);
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length} // allows a whole code to be pasted or auto-filled into one box
          value={value[i] ?? ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={`h-14 w-11 rounded-md bg-surface-highlight text-center font-sans text-2xl font-bold outline-none ring-1 transition focus:ring-2 sm:w-12 ${
            hasError ? "ring-red-500" : "ring-white/20 hover:ring-white/50 focus:ring-brand focus:shadow-[0_0_18px_-4px_rgba(29,185,84,0.55)]"
          } disabled:opacity-60`}
        />
      ))}
    </div>
  );
}
