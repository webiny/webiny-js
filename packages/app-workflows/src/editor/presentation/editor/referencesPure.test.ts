import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import { addFoundTeams } from "./addFoundTeams.js";
import { addFoundUsers } from "./addFoundUsers.js";
import { chunkIds } from "./chunkIds.js";
import { collectRuleReferenceIds } from "./collectRuleReferenceIds.js";
import { findUnresolvedReferenceIds } from "./findUnresolvedReferenceIds.js";
import { partitionSettled } from "./partitionSettled.js";
import { pruneRuleReferences } from "./pruneRuleReferences.js";
import { resolveRuleReferences } from "./resolveRuleReferences.js";

const FOLDER = { id: "f1", type: "cms:article", includeDescendants: false };

describe("collectRuleReferenceIds (R298)", () => {
    it("collects the distinct users, teams and folders of every People step in rule order", () => {
        const first = createRoutingStep([
            createStoredRule({
                id: "r1",
                requesterUserId: "user-1",
                requesterTeamId: "team-8",
                folder: FOLDER,
                target: { type: "user", id: "user-2" }
            }),
            createStoredRule({
                id: "r2",
                requesterUserId: "user-1",
                folder: FOLDER,
                target: { type: "team", id: "team-9" }
            })
        ]);
        const second = createRoutingStep(
            [
                createStoredRule({
                    id: "r3",
                    folder: { id: "f2", type: "wb:page", includeDescendants: true },
                    target: { type: "user", id: "user-3" }
                })
            ],
            ["team-1"],
            "step-9"
        );

        const ids = collectRuleReferenceIds([first, second], true, []);

        expect(ids.userIds).toEqual(["user-1", "user-2", "user-3"]);
        expect(ids.teamIds).toEqual(["team-8", "team-9"]);
        expect(ids.folders).toEqual([
            { id: "f1", type: "cms:article" },
            { id: "f2", type: "wb:page" }
        ]);
    });

    it("ignores steps that are not People steps and rules without conditions or target", () => {
        const people = createRoutingStep([createStoredRule({ id: "r1", target: null })]);

        const ids = collectRuleReferenceIds([people, createAiStep()], true, []);

        expect(ids).toEqual({ userIds: [], teamIds: [], folders: [] });
    });

    it("collects the users of the ui user settings of Automation steps, also while teams are off", () => {
        const definition = createWebhookAutomation({
            settingsSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", ui: "user" },
                    url: { type: "string" }
                }
            }
        });
        const step = createAutomationStep({
            config: {
                automationId: "send-webhook",
                settings: { owner: "user-5", url: "https://example.com/hook" }
            }
        });
        const other = createAutomationStep({
            id: "step-8",
            config: { automationId: "gone", settings: { owner: "user-6" } }
        });

        const on = collectRuleReferenceIds([step, other], true, [definition]);
        const off = collectRuleReferenceIds([step], false, [definition]);

        expect(on).toEqual({ userIds: ["user-5"], teamIds: [], folders: [] });
        expect(off.userIds).toEqual(["user-5"]);
    });

    it("collects nothing while the review step type is unavailable (teams off, R290)", () => {
        const people = createRoutingStep([
            createStoredRule({ id: "r1", requesterUserId: "user-1", folder: FOLDER })
        ]);

        expect(collectRuleReferenceIds([people], false, [])).toEqual({
            userIds: [],
            teamIds: [],
            folders: []
        });
    });
});

describe("findUnresolvedReferenceIds", () => {
    it("keeps only the ids no map holds", () => {
        const references = createRuleReferences({
            users: [{ id: "user-1", label: "Ada", state: "found" }],
            teams: [{ id: "team-9", label: "Deleted team", state: "deleted" }],
            folders: [{ id: "f1", label: "/News", state: "found" }]
        });

        const missing = findUnresolvedReferenceIds(
            {
                userIds: ["user-1", "user-2"],
                teamIds: ["team-9", "team-8"],
                folders: [
                    { id: "f1", type: "cms:article" },
                    { id: "f2", type: "cms:article" }
                ]
            },
            references
        );

        expect(missing).toEqual({
            userIds: ["user-2"],
            teamIds: ["team-8"],
            folders: [{ id: "f2", type: "cms:article" }]
        });
    });
});

describe("chunkIds", () => {
    it("splits a list into chunks of at most the size, in order", () => {
        expect(chunkIds([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
        expect(chunkIds([], 200)).toEqual([]);
    });
});

describe("partitionSettled", () => {
    it("keeps the fulfilled values and reports a failure", () => {
        const results: PromiseSettledResult<number>[] = [
            { status: "fulfilled", value: 1 },
            { status: "rejected", reason: new Error("down") },
            { status: "fulfilled", value: 3 }
        ];

        expect(partitionSettled(results)).toEqual({ values: [1, 3], failed: true });
        expect(partitionSettled<number>([])).toEqual({ values: [], failed: false });
    });
});

describe("addFoundUsers and addFoundTeams", () => {
    it("add found entries and the users' team ids without touching the other maps", () => {
        const empty = createEmptyRuleReferences();

        const withUsers = addFoundUsers(empty, [
            { id: "user-1", displayName: "Ada Lovelace", teamIds: ["team-1", "team-2"] }
        ]);
        const withTeams = addFoundTeams(withUsers, [
            { id: "team-1", name: "Editors", memberCount: 3 }
        ]);

        expect(withTeams.users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(withTeams.userTeamIds.get("user-1")).toEqual(["team-1", "team-2"]);
        expect(withTeams.teams.get("team-1")).toEqual({
            id: "team-1",
            label: "Editors",
            state: "found"
        });
        expect(empty.users.size).toBe(0);
    });

    it("replaces an older entry of the same id", () => {
        const deleted = createRuleReferences({
            users: [{ id: "user-1", label: "Deleted user", state: "deleted" }]
        });

        const found = addFoundUsers(deleted, [
            { id: "user-1", displayName: "Ada Lovelace", teamIds: [] }
        ]);

        expect(found.users.get("user-1")?.state).toBe("found");
    });
});

describe("resolveRuleReferences (R298)", () => {
    const requested = {
        userIds: ["user-1", "user-2"],
        teamIds: ["team-8", "team-9"],
        folders: [
            { id: "f1", type: "cms:article" },
            { id: "f2", type: "cms:article" },
            { id: "f3", type: "cms:article" },
            { id: "f4", type: "cms:article" }
        ]
    };

    it("labels found, deleted, restricted and unresolved references", () => {
        const references = resolveRuleReferences({
            previous: createEmptyRuleReferences(),
            requested,
            users: [{ id: "user-1", displayName: "Ada Lovelace", teamIds: ["team-1"] }],
            missingUserIds: ["user-2"],
            teams: [{ id: "team-8", name: "Marketing", memberCount: 2 }],
            missingTeamIds: ["team-9"],
            folders: [{ id: "f1", path: "/News" }],
            folderExistence: new Map([
                ["f2", true],
                ["f3", false]
            ])
        });

        expect(references.users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(references.userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(references.users.get("user-2")).toEqual({
            id: "user-2",
            label: "Deleted user",
            state: "deleted"
        });
        expect(references.teams.get("team-8")?.label).toBe("Marketing");
        expect(references.teams.get("team-9")).toEqual({
            id: "team-9",
            label: "Deleted team",
            state: "deleted"
        });
        expect(references.folders.get("f1")).toEqual({
            id: "f1",
            label: "/News",
            state: "found"
        });
        expect(references.folders.get("f2")).toEqual({
            id: "f2",
            label: "Restricted folder",
            state: "restricted"
        });
        expect(references.folders.get("f3")).toEqual({
            id: "f3",
            label: "Deleted folder",
            state: "deleted"
        });
        // No answer for f4 (the existence check failed): it stays unresolved.
        expect(references.folders.has("f4")).toBe(false);
    });

    it("keeps what was resolved before and does not change the previous maps", () => {
        const previous = createRuleReferences({
            users: [{ id: "user-7", label: "Grace Hopper", state: "found" }]
        });

        const references = resolveRuleReferences({
            previous,
            requested: { userIds: [], teamIds: [], folders: [] },
            users: [],
            missingUserIds: [],
            teams: [],
            missingTeamIds: [],
            folders: [],
            folderExistence: new Map()
        });

        expect(references.users.get("user-7")?.label).toBe("Grace Hopper");
        expect(references).not.toBe(previous);
    });
});

describe("pruneRuleReferences", () => {
    it("keeps only the entries of the wanted ids", () => {
        const references = createRuleReferences({
            users: [
                { id: "user-1", label: "Ada", state: "found" },
                { id: "user-2", label: "Deleted user", state: "deleted" }
            ],
            teams: [{ id: "team-8", label: "Marketing", state: "found" }],
            folders: [{ id: "f1", label: "/News", state: "found" }],
            userTeamIds: { "user-1": ["team-1"], "user-2": [] }
        });

        const pruned = pruneRuleReferences(references, {
            userIds: ["user-1"],
            teamIds: [],
            folders: [{ id: "f1", type: "cms:article" }]
        });

        expect([...pruned.users.keys()]).toEqual(["user-1"]);
        expect([...pruned.userTeamIds.keys()]).toEqual(["user-1"]);
        expect(pruned.teams.size).toBe(0);
        expect([...pruned.folders.keys()]).toEqual(["f1"]);
    });
});
