import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeaturedGoals } from "./featured-goals";

describe("FeaturedGoals", () => {
  it("renders all six locally hosted Spartan clips", () => {
    const markup = renderToStaticMarkup(<FeaturedGoals />);

    expect(markup.match(/<video/g)).toHaveLength(6);
    expect(markup.match(/preload="none"/g)).toHaveLength(6);
    expect(markup.match(/media="\(max-width: 699px\)"/g)).toHaveLength(6);
    expect(markup).toContain("/videos/featured-goals/sagaz-2026-mobile.mp4");
    expect(markup).toContain("/videos/featured-goals/sagaz-2026.mp4");
    expect(markup).toContain("/videos/featured-goals/sagaz-2026.jpg");
    expect(markup).toContain("/videos/featured-goals/devon-2022.mp4");
    expect(markup).toContain("View the Spartan leaderboard");
  });
});
