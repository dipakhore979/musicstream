// Colour wash behind the top of a page that fades into the page background (Spotify's header look).
// Parent must be `relative`; put page content in a `relative` sibling so it sits above this.
export default function HeroBackdrop({ color, height = "h-[26rem]" }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 ${height} transition-colors duration-700`}
        style={{ backgroundColor: color }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 ${height} bg-gradient-to-b from-black/25 to-black`}
      />
    </>
  );
}
