import { Component } from "react";

// Catches rendering crashes so users see a friendly message instead of a blank screen.
// `compact` renders inside the page area (keeping the sidebar and player alive);
// `resetKey` clears the error when it changes (we pass the current route).
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    const box = this.props.compact ? "h-full min-h-[50vh]" : "min-h-screen bg-black";
    return (
      <div role="alert" className={`flex flex-col items-center justify-center gap-4 p-6 text-center ${box}`}>
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-muted">
          An unexpected error occurred. Reloading usually fixes it. If it keeps happening, please let the site admin know.
        </p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
          <a href="/" className="btn-outline">Go home</a>
        </div>
      </div>
    );
  }
}
