import { describe, expect, it } from "vitest";
import { safeAppPath } from "./navigation";

describe("safeAppPath", () => {
  it("keeps internal admin destinations", () => {
    expect(safeAppPath("/app/groups/123?tab=settings")).toBe("/app/groups/123?tab=settings");
  });

  it.each(["https://example.com", "//example.com", "/explore", undefined])("rejects unsafe or public destinations", (value) => {
    expect(safeAppPath(value)).toBe("/app");
  });
});
