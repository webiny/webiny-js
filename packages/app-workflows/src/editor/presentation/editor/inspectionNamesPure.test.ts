import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";
import { buildInspectionNames } from "./buildInspectionNames.js";
import { collectInspectionLookupIds } from "./collectInspectionLookupIds.js";

describe("collectInspectionLookupIds (R301, Copy gap 4)", () => {
    it("asks for the candidates and the unnamed skipped people the maps do not know", () => {
        const references = createRuleReferences({
            users: [
                { id: "user-1", label: "Ada Lovelace", state: "found" },
                { id: "user-9", label: "Deleted user", state: "deleted" }
            ]
        });
        const inspection = createTestInspection({
            candidateIds: ["user-1", "user-2", "user-9"],
            candidateCount: 3,
            skipped: [
                { userId: "user-3", displayName: null, reason: "Cannot read this content." },
                { userId: "user-4", displayName: "Grace Hopper", reason: "Excluded from reviews." },
                { userId: "user-2", displayName: null, reason: "The requester cannot review." }
            ]
        });

        const ids = collectInspectionLookupIds(inspection, references);

        expect(ids.userIds).toEqual(["user-2", "user-3"]);
        expect(ids.teamIds).toEqual([]);
    });

    it("asks for the narrowed team unless the maps know it", () => {
        const references = createRuleReferences({
            teams: [{ id: "team-1", label: "Editors", state: "found" }]
        });

        const unknown = collectInspectionLookupIds(
            createTestInspection({ narrowedTeamId: "team-9" }),
            references
        );
        const known = collectInspectionLookupIds(
            createTestInspection({ narrowedTeamId: "team-1" }),
            references
        );
        const none = collectInspectionLookupIds(createTestInspection(), references);

        expect(unknown.teamIds).toEqual(["team-9"]);
        expect(known.teamIds).toEqual([]);
        expect(none.teamIds).toEqual([]);
    });
});

describe("buildInspectionNames (R301)", () => {
    it("takes the found references first and adds the looked-up names", () => {
        const references = createRuleReferences({
            users: [
                { id: "user-1", label: "Ada Lovelace", state: "found" },
                { id: "user-9", label: "Deleted user", state: "deleted" }
            ],
            teams: [{ id: "team-1", label: "Editors", state: "found" }]
        });

        const names = buildInspectionNames({
            references,
            users: [createListedUser("user-2", "Grace Hopper")],
            teams: [{ id: "team-9", name: "Marketing", memberCount: 2 }]
        });

        expect([...names.users.entries()]).toEqual([
            ["user-1", "Ada Lovelace"],
            ["user-2", "Grace Hopper"]
        ]);
        expect([...names.teams.entries()]).toEqual([
            ["team-1", "Editors"],
            ["team-9", "Marketing"]
        ]);
    });
});
