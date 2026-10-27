import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { ListTeamsInput } from "@webiny/api-core/features/security/teams/shared/types.js";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { RoutingEvaluatorService } from "@webiny/api-workflows/features/routing/RoutingEvaluatorService/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { ADMIN, WB_READER } from "~tests/__helpers/identities.js";
import { folderLevels, folderTeams } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { folderRecordReads, folderTeamLevels } from "~tests/__helpers/FakeGetFlp.js";
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
 * Members of the step team, all page readers. Even members are also in the legal team, which has
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

const listReadableMembers = async (memberCount: number): Promise<string[]> => {
    const members = createMembers(memberCount);
    const permissionsByIdentity: Record<string, SecurityPermission[]> = {};
    for (const member of members) {
        permissionsByIdentity[member.identity.id] = WB_READER;
    }
    const context = await createUserContext({
        permissionsByIdentity,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(TeamFactory, new TestTeamFactory());
                container.registerInstance(ListUsersUseCase, new FakeListUsers(members));
                container.registerDecorator(RecordingListTeams);
            }
        ]
    });
    const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
    // The folder grants only the legal team; no user has a permission of their own.
    folderTeamLevels.set("folder-1", new Map([[LEGAL_TEAM, "viewer"]]));
    teamLists.length = 0;
    folderRecordReads.count = 0;

    const listed = await context.container.resolve(RoutingEvaluatorService).listMembers({
        teamIds: [STEP_TEAM],
        requesterId: ADMIN.id,
        model: "wb.page",
        read: { type: "target", targetId: page.entryId, targetRevisionId: page.id },
        now: new Date()
    });
    expect(listed.isOk()).toBe(true);
    return listed.value.filter(member => member.canRead).map(member => member.id);
};

describe("WB candidate read checks with teams on (Q79)", () => {
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
