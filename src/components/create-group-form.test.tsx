// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import { CreateGroupForm } from "./create-group-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/app/actions", () => ({ createGroupAction: vi.fn() }));

it("selects public visibility for a new group by default", () => {
  render(<CreateGroupForm />);
  expect(screen.getByRole("radio", { name: /Public/i })).toBeChecked();
  expect(screen.getByRole("radio", { name: /Private/i })).not.toBeChecked();
});
