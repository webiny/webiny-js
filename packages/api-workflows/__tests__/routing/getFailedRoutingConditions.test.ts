import { describe, expect, it } from "vitest";
import { getFailedRoutingConditions } from "~/domain/routing/getFailedRoutingConditions.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "~/domain/routing/types.js";

const FACTS: RoutingRuleFacts = {
    requesterId: "user-requester",
    requesterTeamIds: ["team-authors"],
    modelId: "article",
    folder: { id: "folder-child", type: "cms:article" },
    folderChainIds: ["folder-child", "folder-parent"]
};

const folder = (id: string, includeDescendants: boolean, type = "cms:article") => {
    return { id, type, includeDescendants };
};

describe("getFailedRoutingConditions (R289)", () => {
    it("names nothing for a rule without conditions and for conditions that hold", () => {
        expect(getFailedRoutingConditions({}, FACTS)).toEqual([]);
        expect(
            getFailedRoutingConditions(
                {
                    requesterUserId: "user-requester",
                    requesterTeamId: "team-authors",
                    folder: folder("folder-parent", true)
                },
                FACTS
            )
        ).toEqual([]);
    });

    it("names the requester, the requester's team and the folder, in that order", () => {
        expect(getFailedRoutingConditions({ requesterUserId: "user-other" }, FACTS)).toEqual([
            "requesterUser"
        ]);
        expect(getFailedRoutingConditions({ requesterTeamId: "team-other" }, FACTS)).toEqual([
            "requesterTeam"
        ]);
        expect(getFailedRoutingConditions({ folder: folder("folder-other", true) }, FACTS)).toEqual(
            ["folder"]
        );
        expect(
            getFailedRoutingConditions(
                {
                    folder: folder("folder-other", true),
                    requesterTeamId: "team-other",
                    requesterUserId: "user-other"
                },
                FACTS
            )
        ).toEqual(["requesterUser", "requesterTeam", "folder"]);
    });

    it("fails a folder condition for a target in the root and for a folder of another type", () => {
        expect(
            getFailedRoutingConditions(
                { folder: folder("folder-child", false) },
                { ...FACTS, folder: null }
            )
        ).toEqual(["folder"]);
        expect(
            getFailedRoutingConditions({ folder: folder("folder-child", false, "cms:blog") }, FACTS)
        ).toEqual(["folder"]);
    });

    it("matches the target folder itself and, with subfolders, its ancestors", () => {
        expect(
            getFailedRoutingConditions({ folder: folder("folder-child", false) }, FACTS)
        ).toEqual([]);
        expect(
            getFailedRoutingConditions({ folder: folder("folder-parent", false) }, FACTS)
        ).toEqual(["folder"]);
        expect(
            getFailedRoutingConditions({ folder: folder("folder-parent", true) }, FACTS)
        ).toEqual([]);
    });

    it("names nothing for a failed model id, which only fails the rule", () => {
        const conditions: RoutingRuleConditions = { modelId: "page" };

        expect(getFailedRoutingConditions(conditions, FACTS)).toEqual([]);
        expect(matchRoutingRuleConditions(conditions, FACTS)).toBe(false);
    });

    it("agrees with the matcher: a rule matches exactly when no condition failed and the model holds", () => {
        const cases: RoutingRuleConditions[] = [
            {},
            { requesterUserId: "user-requester" },
            { requesterUserId: "user-other" },
            { requesterTeamId: "team-other" },
            { folder: folder("folder-parent", true) },
            { folder: folder("folder-parent", false) },
            { folder: folder("folder-child", false, "cms:blog") },
            {
                requesterUserId: "user-requester",
                requesterTeamId: "team-authors",
                modelId: "article"
            }
        ];

        for (const conditions of cases) {
            const failed = getFailedRoutingConditions(conditions, FACTS);
            const modelHolds = !conditions.modelId || conditions.modelId === FACTS.modelId;
            expect(matchRoutingRuleConditions(conditions, FACTS)).toBe(
                failed.length === 0 && modelHolds
            );
        }
    });
});
