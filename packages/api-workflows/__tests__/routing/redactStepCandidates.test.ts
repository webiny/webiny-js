import { describe, expect, it } from "vitest";
import type { StepCandidate } from "~/domain/routing/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import { redactStepCandidates } from "~/domain/routing/redactStepCandidates.js";

const CANDIDATES: StepCandidate[] = [
    {
        id: "user-anna",
        displayName: "Anna",
        teamIds: ["team-a"],
        excluded: true,
        excludedReason: "On leave"
    },
    {
        id: "user-ben",
        displayName: "Ben",
        teamIds: ["team-a"],
        excluded: false,
        excludedReason: null
    },
    {
        id: "user-cara",
        displayName: "Cara",
        teamIds: ["team-a", "team-b"],
        excluded: true,
        excludedReason: "Cannot read this content."
    }
];

const NONE: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: false };

describe("redactStepCandidates (D97, R120)", () => {
    it("keeps the reasons for editor, reassign and full access", () => {
        expect(redactStepCandidates(CANDIDATES, { ...NONE, editor: true })).toEqual(CANDIDATES);
        expect(redactStepCandidates(CANDIDATES, { ...NONE, reassign: true })).toEqual(CANDIDATES);
        expect(
            redactStepCandidates(CANDIDATES, { fullAccess: true, editor: true, reassign: true })
        ).toEqual(CANDIDATES);
    });

    it("drops every reason for anyone else and keeps who is excluded, in order", () => {
        expect(redactStepCandidates(CANDIDATES, NONE)).toEqual([
            {
                id: "user-anna",
                displayName: "Anna",
                teamIds: ["team-a"],
                excluded: true,
                excludedReason: null
            },
            {
                id: "user-ben",
                displayName: "Ben",
                teamIds: ["team-a"],
                excluded: false,
                excludedReason: null
            },
            {
                id: "user-cara",
                displayName: "Cara",
                teamIds: ["team-a", "team-b"],
                excluded: true,
                excludedReason: null
            }
        ]);
    });

    it("does not change the input", () => {
        const input = CANDIDATES.map(candidate => ({ ...candidate }));

        redactStepCandidates(input, NONE);

        expect(input).toEqual(CANDIDATES);
    });
});
