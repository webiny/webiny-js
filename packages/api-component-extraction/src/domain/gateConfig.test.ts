import { describe, expect, it } from "vitest";
import { resolveStopAfter } from "./gateConfig.js";
import { STAGES } from "~/constants.js";

describe("resolveStopAfter", () => {
    it("runs straight through when no gate is ticked", () => {
        expect(resolveStopAfter([])).toEqual([]);
    });

    it("keeps the gates that were ticked", () => {
        expect(resolveStopAfter(["discover", "plan"])).toEqual(["discover", "plan"]);
    });

    it("pauses after every stage when the caller does not say", () => {
        expect(resolveStopAfter(undefined)).toEqual([...STAGES]);
        expect(resolveStopAfter(null)).toEqual([...STAGES]);
    });

    it("drops names that are not stages", () => {
        expect(resolveStopAfter(["plan", "nonsense"])).toEqual(["plan"]);
    });
});
