import type { Browser } from "@e2e-dev/web";

/*
 * ADMIN BUG, accepted here on purpose: the Headless CMS entry form asks "Leave site?" when the page
 * unloads, even with nothing changed. `ContentEntryFormView` keeps a router transition guard for
 * its whole life, and the router's `history.block` adds a `beforeunload` prompt for as long as any
 * guard is installed, whatever the guard returns (the workflow editor had the same bug, see
 * `useLeaveGuard.ts`). Repro: open any entry, change nothing, reload: the browser asks to leave.
 *
 * The review tests switch users with a full page load, often from an entry form, so they accept
 * that one prompt. Any other native dialog still fails the test.
 */
export const acceptEntryFormLeavePrompt = async (browser: Browser) => {
    await browser.onDialog(async dialog => {
        if (dialog.type !== "beforeunload") {
            throw new Error(`Unexpected ${dialog.type} dialog: ${dialog.message}`);
        }
        await dialog.accept();
    });
};
