import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { describeRule } from "./describeRule.js";

const references = createRuleReferences({
    users: [
        createReferenceLabel({ id: "user-iv", label: "Ivan Horvat" }),
        createReferenceLabel({ id: "user-gone", label: "Deleted user", state: "deleted" })
    ],
    teams: [
        createReferenceLabel({ id: "team-m", label: "Marketing" }),
        createReferenceLabel({ id: "team-l", label: "Legal" }),
        createReferenceLabel({ id: "team-gone", label: "Deleted team", state: "deleted" })
    ],
    folders: [
        createReferenceLabel({ id: "f1", label: "/Campaigns" }),
        createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" }),
        createReferenceLabel({ id: "fx", label: "Deleted folder", state: "deleted" })
    ]
});

describe("describeRule: the design's summary", () => {
    it("reads the design example", () => {
        const rule = createRuleValue({
            requesterTeamId: "team-m",
            folder: { id: "f1", type: "cms:article", includeDescendants: true },
            target: { type: "user", id: "user-iv" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is in Marketing and content is in /Campaigns (incl. subfolders) → Ivan Horvat"
        );
    });

    it("says Always for a rule without conditions and names a team pool target", () => {
        const rule = createRuleValue({ target: { type: "team", id: "team-l" } });

        expect(describeRule(rule, references)).toBe("Always → Legal team pool");
    });

    it("joins the three conditions in the order requester, team, folder", () => {
        const rule = createRuleValue({
            requesterUserId: "user-iv",
            requesterTeamId: "team-m",
            folder: { id: "f1", type: "cms:article", includeDescendants: false },
            target: { type: "team", id: "team-l" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is Ivan Horvat and requester is in Marketing and content is in /Campaigns → Legal team pool"
        );
    });

    it("says (no target) for a rule without a target", () => {
        expect(describeRule(createRuleValue({ target: null }), references)).toBe(
            "Always → (no target)"
        );
    });

    it("names a deleted folder and a restricted folder as the design does", () => {
        const deleted = createRuleValue({
            folder: { id: "fx", type: "cms:article", includeDescendants: false },
            target: { type: "team", id: "team-l" }
        });
        const restricted = createRuleValue({
            folder: { id: "f9", type: "cms:article", includeDescendants: true },
            target: { type: "team", id: "team-l" }
        });

        expect(describeRule(deleted, references)).toBe(
            "If content is in a deleted folder → Legal team pool"
        );
        expect(describeRule(restricted, references)).toBe(
            "If content is in a restricted folder (incl. subfolders) → Legal team pool"
        );
    });

    it("shows the Deleted labels of a deleted user and team", () => {
        const rule = createRuleValue({
            requesterUserId: "user-gone",
            requesterTeamId: "team-gone",
            target: { type: "user", id: "user-gone" }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is Deleted user and requester is in Deleted team → Deleted user"
        );
    });

    it("says Unknown item for a reference that is not resolved", () => {
        const rule = createRuleValue({
            requesterUserId: "user-new",
            target: { type: "user", id: "user-new" }
        });

        expect(describeRule(rule, references)).toBe("If requester is Unknown item → Unknown item");
    });
});

describe("describeRule: a folder that is not resolved", () => {
    it("says Unknown item for a folder condition that is not resolved yet", () => {
        const rule = createRuleValue({
            folder: { id: "f-new", type: "cms:article", includeDescendants: false },
            target: { type: "team", id: "team-l" }
        });

        expect(describeRule(rule, references)).toBe(
            "If content is in Unknown item → Legal team pool"
        );
    });
});

describe("describeRule: conditions the editor cannot show (R313)", () => {
    it("appends and other conditions after the editable conditions", () => {
        const rule = createRuleValue({
            requesterTeamId: "team-m",
            target: { type: "user", id: "user-iv" },
            preserved: { conditions: { modelId: "article" } }
        });

        expect(describeRule(rule, references)).toBe(
            "If requester is in Marketing and other conditions → Ivan Horvat"
        );
    });

    it("says If other conditions match for a rule with only a modelId condition", () => {
        const rule = createRuleValue({
            target: { type: "team", id: "team-l" },
            preserved: { conditions: { modelId: "article" } }
        });

        expect(describeRule(rule, references)).toBe("If other conditions match → Legal team pool");
    });

    it("does not count a preserved rule key as a condition", () => {
        const rule = createRuleValue({
            target: { type: "team", id: "team-l" },
            preserved: { futureRuleKey: true }
        });

        expect(describeRule(rule, references)).toBe("Always → Legal team pool");
    });
});
