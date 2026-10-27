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
            excludedReason: null,
            teams: ["Marketing", "Authors"]
        });

        expect(candidate).toEqual({
            id: "user-1",
            displayName: "Ada Lovelace",
            teamNames: ["Marketing", "Authors"],
            excluded: false,
            excludedReason: null
        });
    });

    it("keeps the excluded reason", () => {
        const candidate = mapStepCandidate({
            id: "user-2",
            displayName: "Grace Hopper",
            excluded: true,
            excludedReason: "On leave until Monday.",
            teams: []
        });

        expect(candidate.excluded).toBe(true);
        expect(candidate.excludedReason).toBe("On leave until Monday.");
    });

    it("maps an excluded candidate without a reason (the viewer may not see reasons, D97)", () => {
        const candidate = mapStepCandidate({
            id: "user-3",
            displayName: "Edsger Dijkstra",
            excluded: true,
            excludedReason: null,
            teams: ["Legal"]
        });

        expect(candidate.excluded).toBe(true);
        expect(candidate.excludedReason).toBeNull();
        expect(candidate.teamNames).toEqual(["Legal"]);
    });
});
