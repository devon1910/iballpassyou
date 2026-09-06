import { describe,expect,it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ActionOverlay } from "./action-overlay";

describe("ActionOverlay",()=>{
  it("announces the active operation",()=>{const html=renderToStaticMarkup(<ActionOverlay label="Saving session"/>);expect(html).toContain('role="status"');expect(html).toContain('aria-label="Saving session"');expect(html).toContain("Saving session")});
  it("renders nothing while inactive",()=>expect(renderToStaticMarkup(<ActionOverlay active={false}/>)).toBe(""));
});
