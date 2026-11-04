import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { ListTeamsInput } from "@webiny/api-core/features/security/teams/shared/types.js";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { RoutingEvaluatorService } from "@webiny/api-workflows/features/routing/RoutingEvaluatorService/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { AUTHOR_NAMESPACE, createAuthorEntry } from "~tests/__helpers/entries.js";
import { ADMIN } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels,
    folderTeams
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeGetFlp, folderRecordReads, folderTeamLevels } from "~tests/__helpers/FakeGetFlp.js";
import { FakeListUsers, type TestUser } from "~tests/__helpers/FakeListUsers.js";

const STEP_TEAM = "team-step";
const LEGAL_TEAM = "team-legal";
const OTHER_TEAM = "team-other";

/** Code-defined teams: their id is their slug. */
class TestTeamFactory implements TeamFactory.Interface {
    public async execute(): TeamFactory.Return {
        return [STEP_TEAM, LEGAL_TEAM, OTHER_TEAM].map(slug => {
            return { name: slug, slug, description: "Defined in code.", roles: [] };
        });
    }
}

/** The `id_in` of every team list, one entry per call. Clear it per test. */
const teamLists: string[][] = [];

class RecordingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(private decoratee: ListTeamsUseCase.Interface) {}

    public async execute(
        params?: ListTeamsInput
    ): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        teamLists.push([...(params?.where?.id_in ?? [])]);
        return this.decoratee.execute(params);
    }
}

const RecordingListTeams = ListTeamsUseCase.createDecorator({
    decorator: RecordingListTeamsImpl,
    dependencies: []
});

/**
 * Members of the step team, all CMS readers. Even members are also in the legal team, which has
 * a `viewer` grant on the folder; odd members are in another team without a grant.
 */
const createMembers = (count: number): TestUser[] => {
    return Array.from({ length: count }, (_, index) => {
        const extraTeam = index % 2 === 0 ? LEGAL_TEAM : OTHER_TEAM;
        return {
            identity: { id: `member-${index}`, type: "admin", displayName: `Member ${index}` },
            teams: [STEP_TEAM, extraTeam]
        };
    });
};

const createAdminContext = async (members: TestUser[]) => {
    const permissionsByIdentity: Record<string, SecurityPermission[]> = {};
    for (const member of members) {
        permissionsByIdentity[member.identity.id] = CMS_READER;
    }
    const registerFakes = (container: Container) => {
        container.register(FakeFolderLevelPermissions);
        container.register(FakeGetFlp);
        container.registerInstance(TeamFactory, new TestTeamFactory());
        container.registerInstance(ListUsersUseCase, new FakeListUsers(members));
        container.registerDecorator(RecordingListTeams);
    };
    const { context } = createContextHandler({
        legacyPlugins: [registerFakes],
        permissionsByIdentity
    });
    return context();
};

const listReadableMembers = async (memberCount: number): Promise<string[]> => {
    const context = await createAdminContext(createMembers(memberCount));
    const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
    // The folder grants only the legal team; no user has a permission of their own.
    folderTeamLevels.set("folder-1", new Map([[LEGAL_TEAM, "viewer"]]));
    teamLists.length = 0;
    folderRecordReads.count = 0;

    const members = await context.container.resolve(RoutingEvaluatorService).listMembers({
        teamIds: [STEP_TEAM],
        requesterId: ADMIN.id,
        model: AUTHOR_NAMESPACE,
        read: { type: "target", targetId: entry.entryId, targetRevisionId: entry.id },
        now: new Date()
    });
    expect(members.isOk()).toBe(true);
    return members.value.filter(member => member.canRead).map(member => member.id);
};

describe("CMS candidate read checks with teams on (Q79)", () => {
    beforeEach(() => {
        folderTeams.enabled = true;
        teamLists.length = 0;
        folderRecordReads.count = 0;
    });

    afterEach(() => {
        folderTeams.enabled = false;
        folderLevels.clear();
        folderTeamLevels.clear();
    });

    it("lets a candidate read the folder through a team grant and denies one without it", async () => {
        const readable = await listReadableMembers(4);

        // Members 0 and 2 are in the legal team; members 1 and 3 only in teams without a grant.
        expect(readable).toEqual(["member-0", "member-2"]);
    });

    it("loads the candidates' teams with one team list, whatever the number of candidates", async () => {
        const few = await listReadableMembers(2);
        const fewLists = teamLists.map(ids => [...ids].sort());
        const fewRecordReads = folderRecordReads.count;

        const many = await listReadableMembers(10);

        expect(few).toEqual(["member-0"]);
        expect(many).toEqual(["member-0", "member-2", "member-4", "member-6", "member-8"]);
        expect(fewLists).toEqual([[LEGAL_TEAM, OTHER_TEAM, STEP_TEAM]]);
        expect(teamLists.map(ids => [...ids].sort())).toEqual([
            [LEGAL_TEAM, OTHER_TEAM, STEP_TEAM]
        ]);
        expect(fewRecordReads).toBe(1);
        expect(folderRecordReads.count).toBe(1);
    });
});
