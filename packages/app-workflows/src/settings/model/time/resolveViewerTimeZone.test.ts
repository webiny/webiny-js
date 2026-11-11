import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { resolveViewerTimeZone } from "./resolveViewerTimeZone.js";

// Makes `Intl.DateTimeFormat()` resolve to the given zone; the formatter is built before the spy.
const stubResolvedZone = (timeZone: string): void => {
    const format = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" });
    const options = format.resolvedOptions();
    const resolved: Intl.ResolvedDateTimeFormatOptions = { ...options, timeZone };
    vi.spyOn(format, "resolvedOptions").mockReturnValue(resolved);
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue(format);
};

describe("resolveViewerTimeZone (R319)", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the zone the browser resolves", () => {
        stubResolvedZone("Europe/Zagreb");

        expect(resolveViewerTimeZone()).toBe("Europe/Zagreb");
    });

    it("returns UTC when the browser resolves an empty zone", () => {
        stubResolvedZone("");

        expect(resolveViewerTimeZone()).toBe("UTC");
    });

    it("returns UTC when Intl throws", () => {
        vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
            throw new RangeError("Incorrect locale information provided");
        });

        expect(resolveViewerTimeZone()).toBe("UTC");
    });
});
