import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "@/lib/config";

describe("resolveSiteUrl", () => {
  it("keeps a valid HTTP(S) deployment origin", () => {
    expect(resolveSiteUrl("https://iballpassyou.vercel.app/path")).toBe("https://iballpassyou.vercel.app");
  });

  it("falls back instead of breaking a build for an invalid deployment value", () => {
    expect(resolveSiteUrl("[SENSITIVE]")).toBe("http://localhost:3000");
    expect(resolveSiteUrl("ftp://example.com")).toBe("http://localhost:3000");
  });
});
