// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SessionPlayerStats } from "./session-player-stats";
import { updateAppearanceStatsAction } from "@/app/app/actions";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/app/actions", () => ({ updateAppearanceStatsAction: vi.fn() }));

const appearances = [
  { playerId: "ada", playerName: "Ada", goals: 2, assists: 1 },
  { playerId: "bola", playerName: "Bola", goals: 0, assists: 3 },
];

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

it("edits one player's assists in place and saves only that player's stats", async () => {
  vi.mocked(updateAppearanceStatsAction).mockResolvedValue({ ok: true });
  render(<SessionPlayerStats groupId="group" sessionId="session" appearances={appearances} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit stats for Ada" }));
  expect(screen.getByRole("spinbutton", { name: "Ada assists" })).toHaveValue(1);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Ada assists" }), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Save stats" }));
  await waitFor(() => expect(updateAppearanceStatsAction).toHaveBeenCalledWith({ groupId: "group", sessionId: "session", playerId: "ada", goals: 2, assists: 2 }));
  await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  expect(screen.getByText("2G 2A")).toBeInTheDocument();
  expect(screen.getByText("0G 3A")).toBeInTheDocument();
});

it("keeps the editor open when saving fails", async () => {
  vi.mocked(updateAppearanceStatsAction).mockResolvedValue({ ok: false, error: "Couldn’t save these stats." });
  render(<SessionPlayerStats groupId="group" sessionId="session" appearances={appearances} />);
  fireEvent.click(screen.getByRole("button", { name: "Edit stats for Bola" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Bola assists" }), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Save stats" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t save these stats.");
  expect(screen.getByRole("spinbutton", { name: "Bola assists" })).toHaveValue(4);
  expect(refresh).not.toHaveBeenCalled();
});
