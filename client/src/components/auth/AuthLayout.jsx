import { LogoMark, Wordmark } from "../ui/Logo.jsx";

export default function AuthLayout({ title, children, footer }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-surface-highlight to-black px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="group flex items-center gap-3">
            <LogoMark size={44} />
            <Wordmark className="text-3xl" />
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        {children}
        <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-muted">{footer}</div>
      </div>
    </div>
  );
}
