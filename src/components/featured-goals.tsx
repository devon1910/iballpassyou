import Link from "next/link";

const goals = [
  { player: "Sagaz", year: 2026, src: "/videos/featured-goals/sagaz-2026.mp4", mobileSrc: "/videos/featured-goals/sagaz-2026-mobile.mp4", poster: "/videos/featured-goals/sagaz-2026.jpg" },
  { player: "Sammy", year: 2026, src: "/videos/featured-goals/sammy-2026.mp4", mobileSrc: "/videos/featured-goals/sammy-2026-mobile.mp4", poster: "/videos/featured-goals/sammy-2026.jpg" },
  { player: "Sanii", year: 2026, src: "/videos/featured-goals/sanii-2026.mp4", mobileSrc: "/videos/featured-goals/sanii-2026-mobile.mp4", poster: "/videos/featured-goals/sanii-2026.jpg" },
  { player: "Devon", year: 2025, src: "/videos/featured-goals/devon-2025.mp4", mobileSrc: "/videos/featured-goals/devon-2025-mobile.mp4", poster: "/videos/featured-goals/devon-2025.jpg" },
  { player: "Uchenna", year: 2024, src: "/videos/featured-goals/uchenna-2024.mp4", mobileSrc: "/videos/featured-goals/uchenna-2024-mobile.mp4", poster: "/videos/featured-goals/uchenna-2024.jpg" },
  { player: "Devon", year: 2022, src: "/videos/featured-goals/devon-2022.mp4", mobileSrc: "/videos/featured-goals/devon-2022-mobile.mp4", poster: "/videos/featured-goals/devon-2022.jpg" },
] as const;

export function FeaturedGoals() {
  return <section className="featured-goals" aria-labelledby="featured-goals-title">
    <div className="featured-goals-head">
      <div><p className="section-label">Featured goals</p><h2 id="featured-goals-title">SPARTAN BANGERS</h2></div>
      <p>Six finishes from the archive. Press play and enjoy the receipts.</p>
    </div>
    <div className="goal-reel">
      {goals.map((goal, index) => <article className="goal-card" key={goal.src}>
        <div className="goal-video">
          <video controls playsInline preload="none" poster={goal.poster} aria-label={`${goal.player}'s featured Spartan goal from ${goal.year}`}>
            <source src={goal.mobileSrc} type="video/mp4" media="(max-width: 699px)" />
            <source src={goal.src} type="video/mp4" />
            Your browser does not support embedded videos.
          </video>
          <span className="goal-number" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="goal-caption">
          <p>Spartan archive · {goal.year}</p>
          <h3>{goal.player}</h3>
        </div>
      </article>)}
    </div>
    <Link className="text-link featured-goals-link" href="/groups/spartan">View the Spartan leaderboard →</Link>
  </section>;
}
