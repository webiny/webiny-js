import { describe, expect, it } from "vitest";
import { COMPONENT_STATUSES, toComponentStatus } from "./componentStatus.js";

describe("component status", () => {
    it("is the four bundle states and nothing else", () => {
        expect([...COMPONENT_STATUSES]).toEqual(["draft", "bundled", "stale", "failed"]);
    });

    it("no longer carries `published`", () => {
        // It was rendered as the Library list's success chip and never written by anything.
        // Availability is a separate axis; if it becomes real it gets its own field.
        expect(COMPONENT_STATUSES).not.toContain("published");
        expect(toComponentStatus("published")).toBe("draft");
    });

    it("narrows anything it does not recognise to draft", () => {
        // The GraphQL field is an enum, so a single unrecognised row would otherwise fail the whole
        // query for every component listed beside it.
        expect(toComponentStatus("")).toBe("draft");
        expect(toComponentStatus(undefined)).toBe("draft");
        expect(toComponentStatus(null)).toBe("draft");
        expect(toComponentStatus(42)).toBe("draft");
        expect(toComponentStatus("Bundled")).toBe("draft");
    });

    it("passes through each known value unchanged", () => {
        for (const status of COMPONENT_STATUSES) {
            expect(toComponentStatus(status)).toBe(status);
        }
    });
});
