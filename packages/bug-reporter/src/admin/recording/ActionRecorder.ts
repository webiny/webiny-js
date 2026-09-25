import { ActionRecorder as Abstraction } from "./abstractions.js";
import type { RecordedEventKind } from "./abstractions.js";

/*
 * How many events we keep. The buffer is a window onto the recent past, not a log: by the
 * time someone files a report, anything older than the last hundred-odd interactions is
 * noise that makes the issue harder to read.
 */
const MAX_EVENTS = 150;

const MAX_TEXT_LENGTH = 180;

const INTERACTIVE_SELECTOR =
    "button, a, [role='button'], [role='menuitem'], [role='tab'], input, select, textarea, label";

function condense(value: string): string {
    const collapsed = value.replace(/\s+/g, " ").trim();
    if (collapsed.length <= MAX_TEXT_LENGTH) {
        return collapsed;
    }
    return `${collapsed.slice(0, MAX_TEXT_LENGTH)}...`;
}

function readSelector(element: Element): string {
    const testId = element.getAttribute("data-testid");
    if (testId) {
        return `[data-testid="${testId}"]`;
    }

    const tag = element.tagName.toLowerCase();
    if (element.id) {
        return `${tag}#${element.id}`;
    }

    return tag;
}

function readLabel(element: Element): string {
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
        return condense(ariaLabel);
    }

    const title = element.getAttribute("title");
    if (title) {
        return condense(title);
    }

    const placeholder = element.getAttribute("placeholder");
    if (placeholder) {
        return condense(placeholder);
    }

    const text = element.textContent ?? "";
    return condense(text).slice(0, 60);
}

/*
 * A label is only read off something interactive — a button, a link, a menu item. Falling back to
 * the raw click target would read its text, and clicking a table cell that shows a customer's email
 * would put that email in the issue. Same reason field values are never recorded: the selector says
 * where they clicked without saying what was in it.
 */
function describeTarget(target: EventTarget | null): string {
    if (!(target instanceof Element)) {
        return "an unknown element";
    }

    const interactive = target.closest(INTERACTIVE_SELECTOR);

    if (!interactive) {
        return readSelector(target);
    }

    const label = readLabel(interactive);
    const selector = readSelector(interactive);

    if (label) {
        return `"${label}" (${selector})`;
    }

    return selector;
}

function describeError(reason: unknown): string {
    if (reason instanceof Error) {
        return condense(`${reason.name}: ${reason.message}`);
    }
    return condense(String(reason));
}

function readStack(error: unknown): string | undefined {
    if (error instanceof Error && error.stack) {
        return condense(error.stack);
    }
    return undefined;
}

function formatArguments(args: unknown[]): string {
    const parts: string[] = [];

    for (const arg of args) {
        if (typeof arg === "string") {
            parts.push(arg);
            continue;
        }
        if (arg instanceof Error) {
            parts.push(`${arg.name}: ${arg.message}`);
            continue;
        }
        parts.push(String(arg));
    }

    return condense(parts.join(" "));
}

function shortenUrl(url: string): string {
    try {
        const parsed = new URL(url, window.location.origin);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return url;
    }
}

function readRequestUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") {
        return input;
    }
    if (input instanceof URL) {
        return input.toString();
    }
    return input.url;
}

function readRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
    if (init?.method) {
        return init.method.toUpperCase();
    }
    if (input instanceof Request) {
        return input.method.toUpperCase();
    }
    return "GET";
}

/*
 * GraphQL travels over a single endpoint, so the URL says nothing useful. The operation
 * name is what a reader actually recognises ("updateContentEntry failed"), so we dig it
 * out of the request body when the body is a plain JSON string.
 */
function readOperationName(init?: RequestInit): string | null {
    const body = init?.body;
    if (typeof body !== "string") {
        return null;
    }

    try {
        const parsed: Record<string, unknown> = JSON.parse(body);
        const operationName = parsed.operationName;
        if (typeof operationName === "string" && operationName !== "") {
            return operationName;
        }
    } catch {
        return null;
    }

    return null;
}

function describeLocation(): string {
    return `${window.location.pathname}${window.location.search}`;
}

/*
 * Records what the person was doing in the moments before they hit "report a bug": route
 * changes, clicks, fields they touched, failed or GraphQL requests, console errors and
 * uncaught exceptions. Field VALUES are never recorded — only the label of the field —
 * because reports get filed from tenants holding real customer data.
 */
class ActionRecorderImpl implements Abstraction.Interface {
    private events: Abstraction.Event[] = [];
    private running = false;
    private teardown: Array<() => void> = [];

    start(): void {
        if (this.running || typeof window === "undefined") {
            return;
        }

        this.running = true;
        this.watchClicks();
        this.watchInputs();
        this.watchNavigation();
        this.watchNetwork();
        this.watchConsole();
        this.watchExceptions();
        const opened = describeLocation();
        this.record("route", `Opened ${opened}`);
    }

    stop(): void {
        if (!this.running) {
            return;
        }

        for (const undo of this.teardown) {
            undo();
        }

        this.teardown = [];
        this.running = false;
    }

    getEvents(): Abstraction.Event[] {
        return [...this.events];
    }

    private record(kind: RecordedEventKind, summary: string, detail?: string): void {
        const event: Abstraction.Event = { at: Date.now(), kind, summary };
        if (detail) {
            event.detail = detail;
        }

        this.events.push(event);

        if (this.events.length > MAX_EVENTS) {
            this.events.shift();
        }
    }

    private watchClicks(): void {
        const onClick = (event: MouseEvent) => {
            const description = describeTarget(event.target);
            this.record("click", `Clicked ${description}`);
        };

        document.addEventListener("click", onClick, true);

        this.teardown.push(() => {
            document.removeEventListener("click", onClick, true);
        });
    }

    private watchInputs(): void {
        // `change` fires on blur, so this is one event per field rather than one per keystroke.
        const onChange = (event: Event) => {
            const description = describeTarget(event.target);
            this.record("input", `Edited ${description}`);
        };

        document.addEventListener("change", onChange, true);

        this.teardown.push(() => {
            document.removeEventListener("change", onChange, true);
        });
    }

    private watchNavigation(): void {
        const recordLocation = () => {
            const location = describeLocation();
            this.record("route", `Navigated to ${location}`);
        };

        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;

        window.history.pushState = function (
            this: History,
            ...args: Parameters<History["pushState"]>
        ) {
            const result = originalPushState.apply(this, args);
            recordLocation();
            return result;
        };

        window.history.replaceState = function (
            this: History,
            ...args: Parameters<History["replaceState"]>
        ) {
            const result = originalReplaceState.apply(this, args);
            recordLocation();
            return result;
        };

        window.addEventListener("popstate", recordLocation);

        this.teardown.push(() => {
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
            window.removeEventListener("popstate", recordLocation);
        });
    }

    private watchNetwork(): void {
        const originalFetch = window.fetch;

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const method = readRequestMethod(input, init);
            const url = readRequestUrl(input);
            const operationName = readOperationName(init);
            const startedAt = Date.now();

            try {
                const response = await originalFetch(input, init);
                const duration = Date.now() - startedAt;
                this.recordResponse(method, url, operationName, response.status, duration);
                return response;
            } catch (error) {
                const target = operationName ?? shortenUrl(url);
                const detail = describeError(error);
                this.record("network", `${method} ${target} never completed`, detail);
                throw error;
            }
        };

        this.teardown.push(() => {
            window.fetch = originalFetch;
        });
    }

    /*
     * Every asset the admin loads goes through fetch, so recording all of it would bury the
     * interesting events. We keep GraphQL operations (always worth seeing) and anything that
     * came back 4xx/5xx.
     */
    private recordResponse(
        method: string,
        url: string,
        operationName: string | null,
        status: number,
        duration: number
    ): void {
        const failed = status >= 400;
        if (!failed && !operationName) {
            return;
        }

        const target = operationName ?? shortenUrl(url);
        this.record("network", `${method} ${target} → ${status} (${duration}ms)`);
    }

    private watchConsole(): void {
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args: unknown[]) => {
            const formatted = formatArguments(args);
            this.record("console", `console.error: ${formatted}`);
            originalError.apply(console, args);
        };

        console.warn = (...args: unknown[]) => {
            const formatted = formatArguments(args);
            this.record("console", `console.warn: ${formatted}`);
            originalWarn.apply(console, args);
        };

        this.teardown.push(() => {
            console.error = originalError;
            console.warn = originalWarn;
        });
    }

    private watchExceptions(): void {
        const onError = (event: ErrorEvent) => {
            const stack = readStack(event.error);
            const summary = condense(event.message);
            this.record("exception", summary, stack);
        };

        const onRejection = (event: PromiseRejectionEvent) => {
            const stack = readStack(event.reason);
            const reason = describeError(event.reason);
            this.record("exception", `Unhandled rejection: ${reason}`, stack);
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);

        this.teardown.push(() => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        });
    }
}

export const ActionRecorder = Abstraction.createImplementation({
    implementation: ActionRecorderImpl,
    dependencies: []
});
