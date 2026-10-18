import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { FakeListTeams, type FakeTeam } from "~tests/__helpers/FakeListTeams.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowTeamsUseCase } from "~/features/config/ListWorkflowTeams/index.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

const TEAMS: FakeTeam[] = [
    { id: "team-finance", name: "Finance" },
    { id: "team-design", name: "design" },
    { id: "team-editorial", name: "Editorial" },
    { id: "team-empty", name: "Empty team" }
];

/** Anna is in two teams, Bob in one, Cara in none; nobody is in `team-empty`. */
const USERS: FakeUser[] = [
    { id: "user-anna", displayName: "Anna Adams", teams: ["team-editorial", "team-design"] },
    { id: "user-bob", displayName: "bob Brown", teams: ["team-editorial"] },
    { id: "user-cara", displayName: "Cara Clark", teams: [] }
];

/** Every team lookup throws, as a crashed storage driver does. */
class ThrowingListTeams implements ListTeamsUseCase.Interface {
    public async execute(): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        throw new Error("Teams are down.");
    }
}

/** Every user lookup throws, as a crashed storage driver does. */
class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): ReturnType<ListUsersUseCase.Interface["execute"]> {
        throw new Error("Users are down.");
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface TeamsContextParams extends CmsTestHandlerParams {
    teams?: FakeTeam[];
    listTeams?: ListTeamsUseCase.Interface;
    listUsers?: ListUsersUseCase.Interface;
}

const createTeamsContext = async (params: TeamsContextParams = {}) => {
    const teams = new FakeListTeams(params.teams ?? TEAMS);
    const users = new FakeListUsers(USERS);
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListTeamsUseCase, params.listTeams ?? teams);
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
            await params.setup?.(container);
        }
    });
    const identityContext = context.container.resolve(IdentityContext);
    teams.watch(identityContext);
    users.watch(identityContext);
    return {
        container: context.container,
        teams,
        users,
        listTeams: context.container.resolve(ListWorkflowTeamsUseCase)
    };
};

describe("ListWorkflowTeamsUseCase (Q42, R268)", () => {
    it("lists every team as id, name and member count, sorted by name, without authorization", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute());

        expect(list).toEqual({
            teams: [
                { id: "team-design", name: "design", memberCount: 1 },
                { id: "team-editorial", name: "Editorial", memberCount: 2 },
                { id: "team-empty", name: "Empty team", memberCount: 0 },
                { id: "team-finance", name: "Finance", memberCount: 0 }
            ],
            missingIds: []
        });
        expect(teams.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
        expect(users.calls).toEqual([
            {
                input: {
                    where: {
                        teams_in: ["team-design", "team-editorial", "team-empty", "team-finance"]
                    }
                },
                authorizationEnabled: false
            }
        ]);
    });

    it("returns only id, name and member count of a team", async () => {
        const { listTeams } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ limit: 1 }));

        expect(Object.keys(list).sort()).toEqual(["missingIds", "teams"]);
        expect(Object.keys(list.teams[0]).sort()).toEqual(["id", "memberCount", "name"]);
        expect(JSON.stringify(list)).not.toContain("Secret description");
        expect(JSON.stringify(list)).not.toContain("role-secret");
        expect(JSON.stringify(list)).not.toContain("-slug");
    });

    it("searches the team name, case-insensitively, and not the slug", async () => {
        const { listTeams } = await createTeamsContext({ permissions: EDITOR });

        const byName = expectOk(await listTeams.execute({ search: "  EDIT " }));
        const bySlug = expectOk(await listTeams.execute({ search: "finance-slug" }));
        const blank = expectOk(await listTeams.execute({ search: "   " }));

        expect(byName.teams.map(team => team.id)).toEqual(["team-editorial"]);
        expect(bySlug.teams).toEqual([]);
        expect(blank.teams).toHaveLength(4);
        expect(byName.missingIds).toEqual([]);
    });

    it("counts the members of the returned teams only, with one user lookup", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ search: "design" }));

        expect(list.teams).toEqual([{ id: "team-design", name: "design", memberCount: 1 }]);
        expect(users.calls).toEqual([
            { input: { where: { teams_in: ["team-design"] } }, authorizationEnabled: false }
        ]);
    });

    it("does not look users up when no team is returned", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ search: "nothing like this" }));

        expect(list).toEqual({ teams: [], missingIds: [] });
        expect(users.calls).toEqual([]);
    });

    it("returns 50 teams by default, at most 200 and at least 1 (R268)", async () => {
        const many = Array.from({ length: 205 }, (_, index): FakeTeam => {
            const number = String(index).padStart(3, "0");
            return { id: `team-${number}`, name: `Team ${number}` };
        });
        const { listTeams, users } = await createTeamsContext({
            permissions: EDITOR,
            teams: many
        });

        const byDefault = expectOk(await listTeams.execute());
        const tooMany = expectOk(await listTeams.execute({ limit: 500 }));
        const tooFew = expectOk(await listTeams.execute({ limit: 0 }));
        const fraction = expectOk(await listTeams.execute({ limit: 2.7 }));
        const notFinite = expectOk(await listTeams.execute({ limit: Number.NaN }));

        expect(byDefault.teams).toHaveLength(50);
        expect(byDefault.teams[0]).toEqual({ id: "team-000", name: "Team 000", memberCount: 0 });
        expect(tooMany.teams).toHaveLength(200);
        expect(tooFew.teams).toEqual([{ id: "team-000", name: "Team 000", memberCount: 0 }]);
        expect(fraction.teams).toHaveLength(2);
        expect(notFinite.teams).toHaveLength(50);
        // The member scan only asks about the rows that are returned.
        expect(users.calls[0].input.where?.teams_in).toHaveLength(50);
    });

    it("resolves ids in the given order and reports the missing ones", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(
            await listTeams.execute({
                ids: ["team-editorial", "team-gone", "team-design", "team-editorial"],
                search: "nobody",
                limit: 1
            })
        );

        expect(list).toEqual({
            teams: [
                { id: "team-editorial", name: "Editorial", memberCount: 2 },
                { id: "team-design", name: "design", memberCount: 1 }
            ],
            missingIds: ["team-gone"]
        });
        expect(teams.calls).toEqual([
            {
                input: { where: { id_in: ["team-editorial", "team-gone", "team-design"] } },
                authorizationEnabled: false
            }
        ]);
        expect(users.calls).toEqual([
            {
                input: { where: { teams_in: ["team-editorial", "team-design"] } },
                authorizationEnabled: false
            }
        ]);
    });

    it("reports every id as missing without a user lookup when no team exists", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ ids: ["team-gone", "team-lost"] }));

        expect(list).toEqual({ teams: [], missingIds: ["team-gone", "team-lost"] });
        expect(users.calls).toEqual([]);
    });

    it("refuses more than 200 ids without a lookup", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });
        const ids = Array.from({ length: 201 }, (_, index) => `team-${index}`);

        const result = await listTeams.execute({ ids });
        // Counted after de-duplication: 200 distinct ids plus repeats are allowed.
        const deduplicated = await listTeams.execute({ ids: [...ids.slice(0, 200), "team-0"] });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many team ids.");
        expect(deduplicated.isOk()).toBe(true);
        expect(teams.calls).toHaveLength(1);
        expect(users.calls).toEqual([]);
    });

    it("answers an empty ids list without a lookup", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ ids: [] }));

        expect(list).toEqual({ teams: [], missingIds: [] });
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("allows a full-access permission set", async () => {
        const { listTeams } = await createTeamsContext({
            permissions: [{ name: "workflows.*" }]
        });

        const list = await listTeams.execute();

        expect(list.isOk()).toBe(true);
    });

    it("refuses a user without editor and reads nothing", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: REASSIGNER });

        const result = await listTeams.execute({ search: "fin" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list teams" });
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("refuses an anonymous identity and reads nothing", async () => {
        const { container, listTeams, teams, users } = await createTeamsContext();
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            listTeams.execute()
        );

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("returns the persistence error when the team lookup fails (R87)", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });
        teams.failuresLeft = 1;

        const failed = await listTeams.execute();

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
        expect(users.calls).toEqual([]);
    });

    it("returns the persistence error when the team lookup throws (R87)", async () => {
        const { listTeams } = await createTeamsContext({
            permissions: EDITOR,
            listTeams: new ThrowingListTeams()
        });

        const thrown = await listTeams.execute({ ids: ["team-design"] });

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Teams are down.");
    });

    it("returns the persistence error, not a list of zeros, when the member scan fails (R87)", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });
        users.failuresLeft = 1;

        const failed = await listTeams.execute();

        expect(failed.isFail()).toBe(true);
        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
    });

    it("returns the persistence error when the member scan throws (R87)", async () => {
        const { listTeams } = await createTeamsContext({
            permissions: EDITOR,
            listUsers: new ThrowingListUsers()
        });

        const thrown = await listTeams.execute();

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Users are down.");
    });

    it("returns the persistence error when the permission check throws (R87)", async () => {
        const { listTeams, teams } = await createTeamsContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listTeams.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
        expect(teams.calls).toEqual([]);
    });
});
