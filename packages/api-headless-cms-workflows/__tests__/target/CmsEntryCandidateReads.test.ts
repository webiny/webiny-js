import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { RoutingEvaluatorService } from "@webiny/api-workflows/features/routing/RoutingEvaluatorService/index.js";
import type { ReviewStepConfig } from "@webiny/api-workflows/domain/workflow/types.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { AUTHOR_NAMESPACE, createAuthorEntry } from "~tests/__helpers/entries.js";
import { ADMIN } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeGetFlp, folderRecordReads } from "~tests/__helpers/FakeGetFlp.js";
import { FakeListUsers, type TestUser } from "~tests/__helpers/FakeListUsers.js";
import {
    cmsEntryReads,
    countCmsEntryReads,
    resetCmsEntryReads
} from "~tests/__helpers/CountingCmsEntryReads.js";

const TEAM = "team-candidates";

/** Eight members of one team; the even ones read CMS content, member 0 is denied the folder. */
const MEMBERS: TestUser[] = Array.from({ length: 8 }, (_, index) => {
    return {
        identity: { id: `member-${index}`, type: "admin", displayName: `Member ${index}` },
        teams: [TEAM]
    };
});

const READABLE_IDS = ["member-2", "member-4", "member-6"];

/** Three matching user-target rules: members 0 and 1 cannot read, member 2 can. */
const USER_RULES_STEP: ReviewStepConfig = {
    teams: [TEAM],
    assignment: {
        allowManualPick: false,
        strategy: "none",
        rules: ["member-0", "member-1", "member-2"].map(userId => {
            return { id: `rule-${userId}`, conditions: {}, target: { type: "user", id: userId } };
        })
    }
};

const ROUND_ROBIN_STEP: ReviewStepConfig = {
    teams: [TEAM],
    assignment: { allowManualPick: false, strategy: "roundRobin", rules: [] }
};

/** Counts user reads: the candidates are the users routing listed, so none is read. */
const userReads = { count: 0 };

class CountingGetUser implements GetUserUseCase.Interface {
    public async execute(): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        userReads.count++;
        throw new Error("No user is read for a candidate.");
    }
}

const registerFakes = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.register(FakeGetFlp);
    container.registerInstance(ListUsersUseCase, new FakeListUsers(MEMBERS));
    container.registerInstance(GetUserUseCase, new CountingGetUser());
    countCmsEntryReads(container);
};

const createAdminContext = async () => {
    const permissionsByIdentity: Record<string, SecurityPermission[]> = {};
    for (const [index, member] of MEMBERS.entries()) {
        if (index % 2 === 0) {
            permissionsByIdentity[member.identity.id] = CMS_READER;
        }
    }
    const { context } = createContextHandler({
        legacyPlugins: [registerFakes],
        permissionsByIdentity
    });
    return context();
};

describe("CMS candidate read checks (Q79)", () => {
    beforeEach(() => {
        userReads.count = 0;
        folderRecordReads.count = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("reads the target and the folder record once for every member, and no user", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        folderLevels.set(
            "folder-1",
            new Map([
                ["member-0", "no-access"],
                ["member-2", "viewer"],
                ["member-4", "viewer"],
                ["member-6", "editor"]
            ])
        );
        resetCmsEntryReads();

        const members = await context.container.resolve(RoutingEvaluatorService).listMembers({
            teamIds: [TEAM],
            requesterId: ADMIN.id,
            model: AUTHOR_NAMESPACE,
            read: { type: "target", targetId: entry.entryId, targetRevisionId: entry.id },
            now: new Date()
        });

        expect(members.isOk()).toBe(true);
        const readable = members.value.filter(member => member.canRead).map(member => member.id);
        expect(members.value).toHaveLength(MEMBERS.length);
        expect(readable).toEqual(READABLE_IDS);
        expect(cmsEntryReads.getRevisionById).toBe(1);
        expect(folderRecordReads.count).toBe(1);
        expect(userReads.count).toBe(0);
    });

    it("stops at the first readable candidate of the strategy order, with one target read", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        folderLevels.set(
            "folder-1",
            new Map([
                ["member-0", "no-access"],
                ["member-2", "viewer"]
            ])
        );
        resetCmsEntryReads();

        const evaluated = await context.container.resolve(RoutingEvaluatorService).evaluate({
            config: ROUND_ROBIN_STEP,
            model: AUTHOR_NAMESPACE,
            workflowId: null,
            reviewId: null,
            stepId: "step-1",
            requesterId: ADMIN.id,
            pickedUserId: null,
            folder: { id: "folder-1", type: "cms:author" },
            read: { type: "target", targetId: entry.entryId, targetRevisionId: entry.id },
            now: new Date()
        });

        expect(evaluated.isOk()).toBe(true);
        // Member 0 cannot read the folder and member 1 has no CMS permission (id order).
        expect(evaluated.value.owner?.id).toBe("member-2");
        expect(evaluated.value.skipped.map(skip => skip.userId)).toEqual(["member-0", "member-1"]);
        expect(cmsEntryReads.getRevisionById).toBe(1);
        expect(folderRecordReads.count).toBe(1);
        expect(userReads.count).toBe(0);
    });

    it("checks every rule's user target with one target read and keeps the skips (Q79)", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        folderLevels.set(
            "folder-1",
            new Map([
                ["member-0", "no-access"],
                ["member-2", "viewer"]
            ])
        );
        resetCmsEntryReads();

        const evaluated = await context.container.resolve(RoutingEvaluatorService).evaluate({
            config: USER_RULES_STEP,
            model: AUTHOR_NAMESPACE,
            workflowId: null,
            reviewId: null,
            stepId: "step-1",
            requesterId: ADMIN.id,
            pickedUserId: null,
            folder: { id: "folder-1", type: "cms:author" },
            read: { type: "target", targetId: entry.entryId, targetRevisionId: entry.id },
            now: new Date()
        });

        expect(evaluated.isOk()).toBe(true);
        expect(evaluated.value.owner?.id).toBe("member-2");
        expect(evaluated.value.ruleId).toBe("rule-member-2");
        expect(evaluated.value.records).toEqual([
            {
                kind: "skip",
                userId: "member-0",
                source: "rule",
                ruleId: "rule-member-0",
                by: null,
                reason: "Cannot read this content."
            },
            {
                kind: "skip",
                userId: "member-1",
                source: "rule",
                ruleId: "rule-member-1",
                by: null,
                reason: "Cannot read this content."
            },
            expect.objectContaining({
                kind: "outcome",
                userId: "member-2",
                ruleId: "rule-member-2"
            })
        ]);
        expect(evaluated.value.trace.map(entry => entry.outcome)).toEqual([
            "skipped",
            "skipped",
            "matched"
        ]);
        expect(cmsEntryReads.getRevisionById).toBe(1);
        expect(folderRecordReads.count).toBe(1);
        expect(userReads.count).toBe(0);
    });
});
