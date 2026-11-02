import { describe, expect, it } from "vitest";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import { ROUTING_SKIP_REASONS } from "~/domain/routing/reasons.js";
import type { RoutingRuleFacts } from "~/domain/routing/types.js";

const FACTS: RoutingRuleFacts = {
    requesterId: "user-requester",
    requesterTeamIds: ["team-authors"],
    modelId: "article",
    folder: { id: "folder-child", type: "cms:article" },
    folderChainIds: ["folder-child", "folder-parent", "folder-root"]
};

describe("matchRoutingRuleConditions (spec 6, R113)", () => {
    it("matches a rule without conditions", () => {
        expect(matchRoutingRuleConditions({}, FACTS)).toBe(true);
    });

    it("matches the requester, the requester's team and the model id", () => {
        expect(matchRoutingRuleConditions({ requesterUserId: "user-requester" }, FACTS)).toBe(true);
        expect(matchRoutingRuleConditions({ requesterUserId: "user-other" }, FACTS)).toBe(false);
        expect(matchRoutingRuleConditions({ requesterTeamId: "team-authors" }, FACTS)).toBe(true);
        expect(matchRoutingRuleConditions({ requesterTeamId: "team-other" }, FACTS)).toBe(false);
        expect(matchRoutingRuleConditions({ modelId: "article" }, FACTS)).toBe(true);
        expect(matchRoutingRuleConditions({ modelId: "page" }, FACTS)).toBe(false);
    });

    it("matches no model id condition when no app knows the review's model", () => {
        expect(
            matchRoutingRuleConditions({ modelId: "article" }, { ...FACTS, modelId: null })
        ).toBe(false);
        expect(matchRoutingRuleConditions({}, { ...FACTS, modelId: null })).toBe(true);
    });

    it("needs every condition to match", () => {
        expect(
            matchRoutingRuleConditions(
                { requesterUserId: "user-requester", modelId: "page" },
                FACTS
            )
        ).toBe(false);
    });

    it("matches a folder exactly, or with its descendants through the chain", () => {
        const parent = { id: "folder-parent", type: "cms:article" };

        expect(
            matchRoutingRuleConditions({ folder: { ...parent, includeDescendants: false } }, FACTS)
        ).toBe(false);
        expect(
            matchRoutingRuleConditions({ folder: { ...parent, includeDescendants: true } }, FACTS)
        ).toBe(true);
        expect(
            matchRoutingRuleConditions(
                { folder: { id: "folder-child", type: "cms:article", includeDescendants: false } },
                FACTS
            )
        ).toBe(true);
        expect(
            matchRoutingRuleConditions(
                { folder: { id: "folder-child", type: "cms:article", includeDescendants: true } },
                { ...FACTS, folderChainIds: [] }
            )
        ).toBe(true);
    });

    it("needs the same folder type, and never matches a target in the root", () => {
        const folder = { id: "folder-parent", type: "wb:page", includeDescendants: true };

        expect(matchRoutingRuleConditions({ folder }, FACTS)).toBe(false);
        expect(
            matchRoutingRuleConditions(
                { folder: { ...folder, type: "cms:article" } },
                { ...FACTS, folder: null, folderChainIds: [] }
            )
        ).toBe(false);
    });
});

describe("getRoutingUserSkipReason (R112)", () => {
    const params = {
        userId: "user-bob",
        requesterId: "user-requester",
        memberIds: ["user-bob", "user-requester"],
        exclusions: []
    };

    it("checks the requester, then membership, then exclusions", () => {
        expect(getRoutingUserSkipReason(params)).toBeNull();
        expect(getRoutingUserSkipReason({ ...params, userId: "user-requester" })).toBe(
            ROUTING_SKIP_REASONS.requester
        );
        expect(getRoutingUserSkipReason({ ...params, memberIds: ["user-requester"] })).toBe(
            ROUTING_SKIP_REASONS.notMember
        );
        expect(
            getRoutingUserSkipReason({
                ...params,
                exclusions: [{ userId: "user-bob", reason: "On leave until May" }]
            })
        ).toBe(ROUTING_SKIP_REASONS.excluded);
    });
});
