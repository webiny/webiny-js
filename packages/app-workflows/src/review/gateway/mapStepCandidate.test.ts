import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapStepCandidate } from "./mapStepCandidate.js";

describe("mapStepCandidate", () => {
    it("maps an eligible candidate", () => {
        const candidate = mapStepCandidate({
            id: "user-1",
            displayName: "Ada Lovelace",
            excluded: false,
            excludedReason: null
        });

        expect(candidate).toEqual({
            id: "user-1",
            displayName: "Ada Lovelace",
            excluded: false,
            excludedReason: null
        });
    });

    it("keeps the excluded reason", () => {
        const candidate = mapStepCandidate({
            id: "user-2",
            displayName: "Grace Hopper",
            excluded: true,
            excludedReason: "On leave until Monday."
        });

        expect(candidate.excluded).toBe(true);
        expect(candidate.excludedReason).toBe("On leave until Monday.");
    });

    it("maps an excluded candidate without a reason (the viewer may not see reasons, D97)", () => {
        const candidate = mapStepCandidate({
            id: "user-3",
            displayName: "Edsger Dijkstra",
            excluded: true,
            excludedReason: null
        });

        expect(candidate.excluded).toBe(true);
        expect(candidate.excludedReason).toBeNull();
    });
});
