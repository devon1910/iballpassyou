// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareMonthlyMvp } from "./share-monthly-mvp";
import { drawMonthlyMvpImage, drawMonthlyMvpStoryImage } from "@/lib/monthly-mvp-image";

vi.mock("@/lib/monthly-mvp-image", () => ({
  drawMonthlyMvpImage: vi.fn(), drawMonthlyMvpStoryImage: vi.fn(), drawMonthlyMvpOgImage: vi.fn(),
}));

const data = { groupName: "Ballers", month: "August 2026", winners: [{ name: "Ada", goals: 1, assists: 0, wins: 0 }, { name: "Bola", goals: 0, assists: 2, wins: 0 }], points: 4 };

describe("monthly MVP image sharing", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, "fonts", { configurable: true, value: { load: vi.fn().mockResolvedValue(undefined) } });
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    HTMLCanvasElement.prototype.toBlob = vi.fn(callback => callback(new Blob(["receipt"], { type: "image/png" })));
  });

  it("generates the monthly receipt and lets the winner choose a story image", async () => {
    render(<ShareMonthlyMvp data={data} path="/groups/ballers?period=last_month" />);
    fireEvent.click(screen.getByRole("button", { name: "Share Player of the Month" }));
    await waitFor(() => expect(drawMonthlyMvpImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), data));
    expect(screen.getByRole("img", { name: /Ada \/ Bola, Player of the Month for August 2026/, hidden: true })).toBeDefined();
    fireEvent.change(screen.getByLabelText("Receipt format", { selector: "select" }), { target: { value: "1" } });
    await waitFor(() => expect(drawMonthlyMvpStoryImage).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), data));
    expect((await screen.findByRole("button", { name: "Download image", hidden: true })).hasAttribute("disabled")).toBe(false);
  });
});
