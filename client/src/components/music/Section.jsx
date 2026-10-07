import { Link } from "react-router-dom";

export default function Section({ title, showAllTo, children }) {
  return (
    <section className="mb-8">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {showAllTo && (
          <Link to={showAllTo} className="text-sm font-bold text-muted hover:underline">
            Show all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
