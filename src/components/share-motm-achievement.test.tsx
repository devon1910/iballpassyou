// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareMotmAchievement } from "./share-motm-achievement";
import { drawMotmReceiptImage } from "@/lib/achievement-image";

vi.mock("@/lib/achievement-image", () => ({
  drawMotmReceiptImage: vi.fn(),
  drawMotmReceiptStoryImage: vi.fn(),
  drawMotmReceiptOgImage: vi.fn(),
}));

const data = {
  playerName: "Ada",
  names: ["Ada"],
  groupName: "Ballers",
  groupSlug: "ballers",
  date: "TUE 08.09.26",
  sessionNumber: 4,
  motm: 1,
  mvp: 0,
  records: [],
  points: 11,
};

describe("MOTM image sharing", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, "fonts", { configurable: true, value: { load: vi.fn().mockResolvedValue(undefined) } });
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    HTMLCanvasElement.prototype.toBlob = vi.fn(callback => callback(new Blob(["receipt"], { type: "image/png" })));
  });

  it("generates a PNG receipt instead of invoking link sharing directly", async () => {
    render(<ShareMotmAchievement data={data} path="/groups/ballers" filename="ballers-08-09-26" />);
    fireEvent.click(screen.getByRole("button", { name: "Share Man of the Match" }));

    await waitFor(() => expect(drawMotmReceiptImage).toHaveBeenCalled());
    expect(screen.getByRole("img", { name: /Man of the Match with 11 points/, hidden: true })).toBeDefined();
    expect((await screen.findByRole("button", { name: "Download image", hidden: true })).hasAttribute("disabled")).toBe(false);
  });
});
