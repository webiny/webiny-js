import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { toEventRows } from "~/admin/clipboard/toEventRows.js";
import { REPORTED_AT } from "./buildPayload.js";

function severityOf(kind: string, summary: string) {
    const events = [{ at: REPORTED_AT, kind, summary }];
    const [row] = toEventRows(events, REPORTED_AT);
    return row?.severity;
}

describe("toEventRows", () => {
    it("marks exceptions and console errors as errors", () => {
        expect(severityOf("exception", "TypeError: x is undefined")).toBe("error");
        expect(severityOf("console", "console.error: boom")).toBe("error");
    });

    it("marks console warnings as warnings", () => {
        expect(severityOf("console", "console.warn: [MobX] strict mode")).toBe("warning");
    });

    it("marks failed requests as errors", () => {
        expect(severityOf("network", "POST Login → 500 (41ms)")).toBe("error");
        expect(severityOf("network", "GET /assets/app.js → 404 (12ms)")).toBe("error");
        expect(severityOf("network", "POST Login never completed")).toBe("error");
    });

    it("leaves successful requests, clicks and navigation unmarked", () => {
        expect(severityOf("network", "POST Login → 200 (41ms)")).toBeNull();
        expect(severityOf("click", 'Clicked "Submit"')).toBeNull();
        expect(severityOf("route", "Opened /")).toBeNull();
    });

    it("does not read a 4xx-looking number in a request name as a failure", () => {
        expect(severityOf("network", "POST Get404Page → 200 (41ms)")).toBeNull();
    });
});
