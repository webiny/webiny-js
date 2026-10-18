import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createTargetMembersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { getRuleTargetOptions } from "./getRuleTargetOptions.js";
import type { RuleTargetOptionsParams } from "./getRuleTargetOptions.js";

const TEAM_NAMES = new Map([
    ["team-1", "Legal"],
    ["team-2", "Marketing"]
]);
const IVAN = createWorkflowUserSummary({
    id: "user-1",
    displayName: "Ivan Horvat",
    teamIds: ["team-1"]
});
const ANA = createWorkflowUserSummary({
    id: "user-2",
    displayName: "Ana Kovač",
    teamIds: ["team-1", "team-2"]
});

const createParams = (
    overrides: Partial<RuleTargetOptionsParams> = {}
): RuleTargetOptionsParams => {
    return {
        stepTeamIds: ["team-1", "team-2"],
        teamNames: TEAM_NAMES,
        members: createTargetMembersSlice({ items: [IVAN, ANA] }),
        target: null,
        references: createReferencesSlice(),
        ...overrides
    };
};

describe("getRuleTargetOptions: the list (R307)", () => {
    it("lists one team pool per reviewing team, then the members with their team names", () => {
        const { options } = getRuleTargetOptions(createParams());

        expect(options).toEqual([
            createPickerOption({ id: "team:team-1", label: "Legal team pool", icon: "groups" }),
            createPickerOption({ id: "team:team-2", label: "Marketing team pool", icon: "groups" }),
            createPickerOption({
                id: "user:user-1",
                label: "Ivan Horvat",
                description: "Legal",
                icon: "person"
            }),
            createPickerOption({
                id: "user:user-2",
                label: "Ana Kovač",
                description: "Legal, Marketing",
                icon: "person"
            })
        ]);
    });

    it("names a team pool with Unknown item when its team name is not known", () => {
        const { options } = getRuleTargetOptions(
            createParams({ stepTeamIds: ["team-9"], members: createTargetMembersSlice() })
        );

        expect(options[0].label).toBe("Unknown item team pool");
    });

    it("lists no pool for a step with no teams and selects nothing for no target", () => {
        const result = getRuleTargetOptions(
            createParams({ stepTeamIds: [], members: createTargetMembersSlice() })
        );

        expect(result).toEqual({ options: [], selected: null });
    });
});

describe("getRuleTargetOptions: a saved team target", () => {
    it("selects the pool of a reviewing team", () => {
        const { selected } = getRuleTargetOptions(
            createParams({ target: { type: "team", id: "team-2" } })
        );

        expect(selected).toEqual(
            createPickerOption({ id: "team:team-2", label: "Marketing team pool", icon: "groups" })
        );
    });

    it("lists a team outside the reviewing teams as {Name} (not in reviewing teams)", () => {
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-3", label: "Press" })]
        });

        const { selected, options } = getRuleTargetOptions(
            createParams({ target: { type: "team", id: "team-3" }, references })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "team:team-3",
                label: "Press (not in reviewing teams)",
                icon: "group"
            })
        );
        expect(options.map(option => option.id)).not.toContain("team:team-3");
    });

    it("shows a deleted team as muted Deleted team", () => {
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-9", label: "Deleted team", state: "deleted" })]
        });

        const { selected } = getRuleTargetOptions(
            createParams({ target: { type: "team", id: "team-9" }, references })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "team:team-9",
                label: "Deleted team",
                muted: true,
                icon: "group_off"
            })
        );
    });

    it("shows the neutral Searching label while an outside team is unresolved, and nothing once it settled", () => {
        const target = { type: "team", id: "team-3" } as const;

        const loading = getRuleTargetOptions(
            createParams({ target, references: createReferencesSlice({}, { loading: true }) })
        );
        const settled = getRuleTargetOptions(createParams({ target }));

        expect(loading.selected).toEqual(
            createPickerOption({ id: "team:team-3", label: "Searching…", muted: true })
        );
        expect(settled.selected).toBeNull();
    });
});

describe("getRuleTargetOptions: a saved user target", () => {
    it("selects a listed member as listed", () => {
        const { selected } = getRuleTargetOptions(
            createParams({ target: { type: "user", id: "user-2" } })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "user:user-2",
                label: "Ana Kovač",
                description: "Legal, Marketing",
                icon: "person"
            })
        );
    });

    it("lists a known user whose teams left the reviewing teams as {Name} (not in reviewing teams)", () => {
        const left = createWorkflowUserSummary({
            id: "user-3",
            displayName: "Luka Perić",
            teamIds: ["team-9"]
        });
        const members = createTargetMembersSlice({ items: [IVAN], selected: [left] });

        const { selected } = getRuleTargetOptions(
            createParams({ members, target: { type: "user", id: "user-3" } })
        );

        expect(selected?.id).toBe("user:user-3");
        expect(selected?.label).toBe("Luka Perić (not in reviewing teams)");
    });

    it("resolves a user nobody listed through the references and flags it by its known teams", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-4", label: "Maja Kos" })],
            userTeamIds: { "user-4": ["team-9"] }
        });

        const { selected } = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-4" } })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "user:user-4",
                label: "Maja Kos (not in reviewing teams)",
                icon: "person"
            })
        );
    });

    it("does not flag a resolved user whose teams are unknown or include a reviewing team", () => {
        const references = createReferencesSlice({
            users: [
                createReferenceLabel({ id: "user-4", label: "Maja Kos" }),
                createReferenceLabel({ id: "user-5", label: "Tin Babić" })
            ],
            userTeamIds: { "user-5": ["team-2"] }
        });

        const unknownTeams = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-4" } })
        );
        const inTeam = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-5" } })
        );

        expect(unknownTeams.selected?.label).toBe("Maja Kos");
        expect(inTeam.selected?.label).toBe("Tin Babić");
    });

    it("shows a deleted user as muted Deleted user", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });

        const { selected } = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-9" } })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "user:user-9",
                label: "Deleted user",
                muted: true,
                icon: "person_off"
            })
        );
    });

    it("shows the neutral Searching label while an unlisted user is unresolved or the lookup failed, and nothing once it settled", () => {
        const target = { type: "user", id: "user-8" } as const;

        const loading = getRuleTargetOptions(
            createParams({ target, references: createReferencesSlice({}, { loading: true }) })
        );
        const failed = getRuleTargetOptions(
            createParams({ target, references: createReferencesSlice({}, { failed: true }) })
        );
        const settled = getRuleTargetOptions(createParams({ target }));

        const expected = createPickerOption({
            id: "user:user-8",
            label: "Searching…",
            muted: true
        });
        expect(loading.selected).toEqual(expected);
        expect(failed.selected).toEqual(expected);
        expect(settled.selected).toBeNull();
    });
});

describe("getRuleTargetOptions: what the editor does not show (Q50)", () => {
    it("lists no Unavailable note and no read-access warning on any option", () => {
        const { options } = getRuleTargetOptions(createParams());

        for (const option of options) {
            expect(option.warning).toBeNull();
            expect(option.description ?? "").not.toMatch(/unavailable|excluded|can't read/i);
        }
    });
});
