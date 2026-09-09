// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareAchievements } from "./share-achievements";
import { drawAchievementImage, type AchievementImageData } from "@/lib/achievement-image";

vi.mock("@/lib/achievement-image", () => ({ drawAchievementImage: vi.fn() }));
const data: AchievementImageData = {
  playerName: "Ada", groupName: "Ballers", motm: 2, mvp: 1,
  records: [
    { format: "No teams", points: 24, goals: 5, assists: 2, date: "1 Aug 2026" },
    { format: "Set play", points: 13, goals: 2, assists: 2, date: "2 Aug 2026" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(document, "fonts", { configurable: true, value: { load: vi.fn().mockResolvedValue([]) } });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["image"], { type: "image/png" })));
  Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn().mockReturnValue(true) });
  Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("achievement image sharing", () => {
  it("prepares the selected record as a PNG before sharing, with the profile link", async () => {
    render(<ShareAchievements data={data} path="/groups/ballers/players/ada" />);
    fireEvent.click(screen.getByRole("button", { name: "Share player achievements" }));
    await screen.findByRole("button", { name: "Share image" });
    expect(navigator.share).not.toHaveBeenCalled();
    expect(drawAchievementImage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), data, data.records[0]);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    await waitFor(() => expect(drawAchievementImage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), data, data.records[1]));
    await waitFor(() => expect((screen.getByRole("button", { name: "Share image" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Share image" }));
    expect(navigator.share).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.objectContaining({ name: "ada-achievements.png", type: "image/png" })], text: expect.stringContaining("/groups/ballers/players/ada") }));
  });

  it("offers download when native file sharing is unavailable", async () => {
    vi.mocked(navigator.canShare).mockReturnValue(false);
    render(<ShareAchievements data={data} path="/groups/ballers/players/ada" />);
    fireEvent.click(screen.getByRole("button", { name: "Share player achievements" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Download image" }) as HTMLButtonElement).disabled).toBe(false));
    expect(screen.queryByRole("button", { name: "Share image" })).toBeNull();
  });

  it("keeps export disabled and explains image generation failures", async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(callback => callback(null));
    render(<ShareAchievements data={data} path="/groups/ballers/players/ada" />);
    fireEvent.click(screen.getByRole("button", { name: "Share player achievements" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Couldn’t create your image");
    expect((screen.getByRole("button", { name: "Download image" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
