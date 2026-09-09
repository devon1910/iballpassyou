// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@supabase/supabase-js";
import { SignInForm } from "./sign-in-form";

const { signInWithOtp } = vi.hoisted(() => ({ signInWithOtp: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signInWithOtp } }) }));
beforeEach(() => { vi.useFakeTimers(); signInWithOtp.mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

async function submit() {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "admin@example.com" } });
  await act(async () => { fireEvent.submit(screen.getByRole("button").closest("form")!); });
}

describe("sign-in request throttling", () => {
  it("blocks duplicate submissions and resends for 60 seconds without retrying automatically", async () => {
    let finish!: (value: { error: null }) => void;
    signInWithOtp.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<SignInForm nextPath="/app/groups/example" />);
    await submit();
    await submit();
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ error: null }); });
    expect(screen.getByRole("status").textContent).toContain("Check your inbox");
    await submit();
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { vi.advanceTimersByTime(60000); });
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    expect(signInWithOtp.mock.calls[0][0].options.emailRedirectTo).toContain("next=%2Fapp%2Fgroups%2Fexample");
  });

  it("explains the email limit without suggesting the email address is wrong", async () => {
    signInWithOtp.mockResolvedValue({ error: new AuthApiError("email rate limit exceeded", 429, "over_email_send_rate_limit") });
    render(<SignInForm />);
    await submit();
    expect(screen.getByRole("alert").textContent).toContain("Sign-in emails are temporarily rate limited");
    expect(screen.getByRole("alert").textContent).toContain("longer than a minute");
    await submit();
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
  });

  it("handles other 429 responses and allows retry after unrelated failures", async () => {
    signInWithOtp.mockResolvedValueOnce({ error: new AuthApiError("Request rate limit reached", 429, "over_request_rate_limit") });
    render(<SignInForm />);
    await submit();
    expect(screen.getByRole("alert").textContent).toContain("Too many sign-in requests");
    await act(async () => { vi.advanceTimersByTime(60000); });
    signInWithOtp.mockRejectedValueOnce(new Error("Network error"));
    await submit();
    expect(screen.getByRole("alert").textContent).toContain("Couldn’t send");
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });
});
