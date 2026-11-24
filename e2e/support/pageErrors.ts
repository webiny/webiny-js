import type { Browser } from "@e2e-dev/web";

/*
 * The `browser` fixture has no console or page-error event, so an init script records them in the
 * page itself: every `console.error` call, every uncaught exception and every unhandled promise
 * rejection. They are kept in sessionStorage, so a reload or a navigation within the admin keeps
 * them until the test reads them.
 */
const STORAGE_KEY = "e2e-page-errors";

const recordPageErrors = (key: string) => {
    const marker = "__e2ePageErrorsInstalled";
    const scope = window as unknown as Record<string, unknown>;
    if (scope[marker]) {
        return;
    }
    scope[marker] = true;

    const record = (line: string) => {
        try {
            const stored = JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[];
            stored.push(line);
            sessionStorage.setItem(key, JSON.stringify(stored));
        } catch {
            // No storage on this document (about:blank): nothing to record into.
        }
    };
    const describe = (value: unknown) => {
        if (value instanceof Error) {
            return value.stack ?? value.message;
        }
        if (typeof value === "string") {
            return value;
        }
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const consoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
        record(`console.error: ${args.map(describe).join(" ")}`);
        consoleError(...args);
    };
    window.addEventListener("error", event => {
        // The browser's notice that a resize was handled in a later frame, not an app error.
        if (!event.error && String(event.message).startsWith("ResizeObserver loop")) {
            return;
        }
        record(`uncaught: ${describe(event.error ?? event.message)}`);
    });
    window.addEventListener("unhandledrejection", event => {
        record(`unhandled rejection: ${describe(event.reason)}`);
    });
};

/** Starts recording page errors in every document the browser loads from now on. */
export const recordPageErrorsFromNowOn = async (browser: Browser) => {
    await browser.addInitScript(recordPageErrors, STORAGE_KEY);
};

/** Returns the page errors recorded so far in the current document's session, and clears them. */
export const takePageErrors = async (browser: Browser): Promise<string[]> => {
    return browser.evaluate((key: string) => {
        try {
            const stored = JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[];
            sessionStorage.removeItem(key);
            return stored;
        } catch {
            return [];
        }
    }, STORAGE_KEY);
};
