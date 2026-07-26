/** Decorative, CSS-driven atmosphere shared by public pages and the filing flow. */
export function AmbientBackground() {
  return (
    <div className="ambient-background" aria-hidden="true">
      <span className="ambient-orb ambient-orb-one" />
      <span className="ambient-orb ambient-orb-two" />
      <span className="ambient-orb ambient-orb-three" />
      <span className="ambient-grid" />
      <span className="ambient-grain" />
    </div>
  );
}
