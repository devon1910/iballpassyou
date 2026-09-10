import { describe, expect, it } from "vitest";
import { code128BPattern, code128BValues } from "./barcode";

describe("Code 128-B receipt barcodes", () => {
  it("encodes printable text with the standard start, checksum and stop", () => {
    expect(code128BValues("ABC")).toEqual([104, 33, 34, 35, 1, 106]);
    expect(code128BPattern("ABC")).toBe("2112141113231311231313212221222331112");
  });

  it("accepts the production receipt URL alphabet", () => {
    expect(() => code128BValues("https://iballpassyou.com/groups/spartan")).not.toThrow();
  });
});
