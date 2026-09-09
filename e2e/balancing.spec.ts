import { test, expect, type Page } from "@playwright/test";

const path = "/app/groups/11111111-1111-4111-8111-111111111111/log";
async function openAdjustment(page: Page, name: string) {
  const summary = page.getByLabel(`Adjust ${name}`, { exact: true });
  if (!await summary.evaluate(el => el.parentElement?.hasAttribute("open"))) await summary.click();
}
test("balance selected attendees, complete profiles, lock, swap, and save normal assignments", async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.goto(path);
  await page.getByRole("button", { name: "Paste list" }).click();
  const names = Array.from({ length: 10 }, (_, i) => `Balance Player ${i + 1}`);
  await page.getByRole("textbox", { name: "Paste player list" }).fill(names.join("\n"));
  await page.getByRole("button", { name: "Check names" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Balance Teams", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No selected players are ready yet" })).toBeVisible();
  await expect(page.getByText("Set each player up once and we reuse those details in future sessions; you can update them in Players any time.")).toBeVisible();
  await expect(page.getByText("You do not need to set up your whole historical roster.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Set up player profiles in Players" })).toHaveAttribute("href", "/app/groups/11111111-1111-4111-8111-111111111111/players");
  await expect(page.getByText("This is more than a random shuffle.")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("balancing-setup-mobile.png"), fullPage: true });
  for (const [i, name] of names.entries()) {
    const profile = page.getByRole("group", { name, exact: true });
    await profile.getByRole("combobox", { name: "Primary position", exact: true }).selectOption(["defender", "midfielder", "attacker"][i % 3]);
    await profile.getByRole("combobox", { name: "Skill Level", exact: true }).selectOption("3");
    if (i < 2) await profile.getByLabel("Keeper capable").check();
    await profile.getByRole("button", { name: /Save/ }).click();
  }
  await page.getByLabel("Team 1 label", { exact: true }).fill("Red");
  await page.getByLabel("Team 2 label", { exact: true }).fill("Black");
  await page.getByLabel("Lock players to teams (optional)", { exact: true }).click();
  await page.getByRole("combobox", { name: "Lock Balance Player 1", exact: true }).selectOption("0");
  await page.getByRole("button", { name: "Generate team suggestions" }).click();
  await expect(page.getByRole("region", { name: /^Option / })).toHaveCount(3);
  await page.getByRole("button", { name: "Try another", exact: true }).click();
  await expect(page.getByRole("region", { name: "Option 4", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Regenerate suggestions" }).click();
  await page.getByRole("button", { name: "Choose option 1", exact: true }).click();
  await openAdjustment(page, "Balance Player 1");
  await expect(page.getByRole("combobox", { name: "Move Balance Player 1", exact: true })).toBeDisabled();
  await page.getByLabel("Adjust Balance Player 1", { exact: true }).click();
  const live = page.getByRole("status", { name: "Live balance" });
  await expect(live).toContainText("excellent balance");
  await page.screenshot({ path: testInfo.outputPath("balancing-mobile.png"), fullPage: true });
  await openAdjustment(page, "Balance Player 2");
  const swap = page.getByRole("combobox", { name: "Swap Balance Player 2", exact: true });
  const target = await swap.locator("option").nth(1).getAttribute("value");
  await swap.selectOption(target!);
  await expect(live).toContainText("good balance");
  // Deliberately change size balance and verify immediate advice, without blocking acceptance.
  for (const name of names.slice(1)) { await openAdjustment(page, name); await page.getByRole("combobox", { name: `Move ${name}`, exact: true }).selectOption("0"); }
  await expect(live).toContainText("Unbalanced");
  // Return to a normal 5v5 before accepting.
  for (const name of names.slice(5)) { await openAdjustment(page, name); await page.getByRole("combobox", { name: `Move ${name}`, exact: true }).selectOption("1"); }
  await page.getByRole("button", { name: "Accept teams", exact: true }).click();
  await expect(page.getByRole("heading", { name: "LOG THE STATS" })).toBeVisible();

  // Stats remain attached to player identities after accepting generated teams.
  await page.getByRole("button", { name: "Add a goal for Balance Player 1", exact: true }).click();
  await page.getByRole("button", { name: "Add a goal for Balance Player 1", exact: true }).click();
  await page.getByRole("button", { name: "Add an assist for Balance Player 1", exact: true }).click();
  await page.getByRole("button", { name: "Add a goal for Balance Player 2", exact: true }).click();
  await expect(page.getByLabel("a goal for Balance Player 1: 2", { exact: true })).toBeVisible();
  await expect(page.getByLabel("an assist for Balance Player 1: 1", { exact: true })).toBeVisible();
  await expect(page.getByLabel("a goal for Balance Player 2: 1", { exact: true })).toBeVisible();

  const storedDraft = () => page.evaluate(() => JSON.parse(localStorage.getItem("ibpy-session-11111111-1111-4111-8111-111111111111")!));
  await expect.poll(async () => {
    const draft = await storedDraft();
    return {
      red: draft.players.filter((p: { selected: boolean; team: number }) => p.selected && p.team === 0).length,
      black: draft.players.filter((p: { selected: boolean; team: number }) => p.selected && p.team === 1).length,
      scorer: draft.players.find((p: { name: string }) => p.name === "Balance Player 1"),
      secondScorer: draft.players.find((p: { name: string }) => p.name === "Balance Player 2"),
    };
  }).toMatchObject({ red: 5, black: 5, scorer: { team: 0, goals: 2, assists: 1 }, secondScorer: { goals: 1, assists: 0 } });

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "RECORD RESULT" })).toBeVisible();
  await page.getByRole("radio", { name: "Red won", exact: true }).check();
  await expect.poll(async () => (await storedDraft()).wins).toEqual([1, 0]);
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(/leaderboard\?saved=1/);
  await expect(page.getByRole("table", { name: "Leaderboard" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("ibpy-session-11111111-1111-4111-8111-111111111111"))).toBeNull();
});

test("manual teams retain the existing assignment workflow", async ({ page }) => {
  await page.goto(path);
  await page.getByText("Davidson", { exact: true }).click();
  await page.getByText("Mike", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Manual Teams", exact: true }).click();
  await expect(page.getByRole("button", { name: "Generate team suggestions" })).toHaveCount(0);
  const pasteTeams = page.locator(".team-sheet > summary");
  await expect(pasteTeams).toHaveText("Paste pre-arranged teams");
  await pasteTeams.click();
  await expect(pasteTeams).toHaveText("Back to manual team assignment");
  await pasteTeams.click();
  await expect(pasteTeams).toHaveText("Paste pre-arranged teams");
  await page.getByRole("button", { name: "Shuffle evenly" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "LOG THE STATS" })).toBeVisible();
});

test("no-team sessions skip balancing", async ({ page }) => {
  await page.goto(path);
  await page.getByText("Davidson", { exact: true }).click();
  await page.getByLabel("Session format", { exact: true }).selectOption("none");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "LOG THE STATS" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Balance Teams" })).toHaveCount(0);
});

test("player management explains and tracks balancing profile setup", async ({ page }) => {
  await page.goto("/app/groups/11111111-1111-4111-8111-111111111111/players");
  await expect(page.getByRole("heading", { name: "0 of 6 active players ready" })).toBeVisible();
  await expect(page.getByText("Skill Level helps create teams. It does not change Performance Rating or public leaderboards.")).toBeVisible();
  await expect(page.getByText("Needs balancing details", { exact: true })).toHaveCount(6);
  await page.getByText("Set up Davidson for balancing", { exact: true }).click();
  await expect(page.getByRole("group", { name: "Davidson", exact: true })).toBeVisible();
});

test("set sessions balance three teams and keep the existing stats flow", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(path);
  const names = ["Davidson", "Mike", "Tunde", "John", "Sean", "Tobi"];
  for (const name of names) await page.getByText(name, { exact: true }).click();
  await page.getByLabel("Session format", { exact: true }).selectOption("sets");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Balance Teams", exact: true }).click();
  await page.getByRole("button", { name: "Add a team", exact: true }).click();
  for (const name of names) {
    const profile = page.getByRole("group", { name, exact: true });
    await profile.getByRole("combobox", { name: "Primary position", exact: true }).selectOption("midfielder");
    await profile.getByRole("combobox", { name: "Skill Level", exact: true }).selectOption("3");
    await profile.getByRole("button", { name: /Save/ }).click();
  }
  await page.getByRole("button", { name: "Generate team suggestions" }).click();
  await page.getByRole("button", { name: "Choose option 1", exact: true }).click();
  const live = page.getByRole("status", { name: "Live balance" });
  await expect(live).toContainText("Only 0 keeper-capable players are available for 3 teams.");
  for (const label of ["Team 1", "Team 2", "Team 3"]) await expect(page.getByRole("region", { name: `${label} players`, exact: true }).locator("details")).toHaveCount(2);
  await page.getByRole("button", { name: "Accept teams" }).click();
  await expect(page.getByRole("heading", { name: "LOG THE STATS" })).toBeVisible();
});
