import { describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, OTHER_TEAM_ID, REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

/** The fake gives every user the email `<id>@webiny.test`. */
const USERS: FakeUser[] = [
    { id: "user-cara", displayName: "Cara Clark", teams: [OTHER_TEAM_ID] },
    { id: "user-anna", displayName: "Anna Adams", teams: [REVIEW_TEAM_ID] },
    { id: "user-bob", displayName: "bob Brown", teams: [] }
];

/** Every user lookup throws, as a crashed storage driver does. */
class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): ReturnType<ListUsersUseCase.Interface["execute"]> {
        throw new Error("Users are down.");
    }
}

/** Throws from the flag read. */
class ThrowingFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get(): ReturnType<FeatureFlags.Interface["get"]> {
        throw new Error("Flags are down.");
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface UsersContextParams extends CmsTestHandlerParams {
    users?: FakeUser[];
    listUsers?: ListUsersUseCase.Interface;
    /** The teams switch; on unless a test says otherwise. */
    teams?: TeamsFlagValue;
}

const createUsersContext = async (params: UsersContextParams = {}) => {
    const users = new FakeListUsers(params.users ?? USERS);
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
            setTeamsFlag(container, params.teams ?? true);
            await params.setup?.(container);
        }
    });
    users.watch(context.container.resolve(IdentityContext));
    return {
        container: context.container,
        users,
        listUsers: context.container.resolve(ListWorkflowUsersUseCase)
    };
};

describe("ListWorkflowUsersUseCase (D48, D117, R123, R286)", () => {
    it("lists every user as id, display name and team ids, sorted by display name, without authorization", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute());

        expect(list).toEqual({
            users: [
                { id: "user-anna", displayName: "Anna Adams", teamIds: [REVIEW_TEAM_ID] },
                { id: "user-bob", displayName: "bob Brown", teamIds: [] },
                { id: "user-cara", displayName: "Cara Clark", teamIds: [OTHER_TEAM_ID] }
            ],
            missingIds: []
        });
        expect(users.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
    });

    it("returns only the id, the display name and the team ids of a user (A103)", async () => {
        const { listUsers } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute());

        for (const user of list.users) {
            expect(Object.keys(user).sort()).toEqual(["displayName", "id", "teamIds"]);
        }
        expect(JSON.stringify(list)).not.toContain("webiny.test");
    });

    it("searches the display name and the email, case-insensitively", async () => {
        const { listUsers } = await createUsersContext({ permissions: EDITOR });

        const byEmail = expectOk(await listUsers.execute({ search: "  ANNA@WEBINY " }));
        const byName = expectOk(await listUsers.execute({ search: "brown" }));
        const byDomain = expectOk(await listUsers.execute({ search: "webiny.test" }));
        const blank = expectOk(await listUsers.execute({ search: "   " }));

        expect(byEmail.users.map(user => user.id)).toEqual(["user-anna"]);
        expect(byName.users.map(user => user.id)).toEqual(["user-bob"]);
        expect(byDomain.users).toHaveLength(3);
        expect(blank.users).toHaveLength(3);
    });

    it("returns 50 users by default, at most 200 and at least 1 (R92)", async () => {
        const many = Array.from({ length: 205 }, (_, index): FakeUser => {
            const number = String(index).padStart(3, "0");
            return { id: `user-${number}`, displayName: `User ${number}`, teams: [] };
        });
        const { listUsers } = await createUsersContext({ permissions: EDITOR, users: many });

        const byDefault = expectOk(await listUsers.execute());
        const tooMany = expectOk(await listUsers.execute({ limit: 500 }));
        const tooFew = expectOk(await listUsers.execute({ limit: 0 }));
        const fraction = expectOk(await listUsers.execute({ limit: 2.7 }));
        const notFinite = expectOk(await listUsers.execute({ limit: Number.NaN }));

        expect(byDefault.users).toHaveLength(50);
        expect(byDefault.users[0]).toEqual({
            id: "user-000",
            displayName: "User 000",
            teamIds: []
        });
        expect(tooMany.users).toHaveLength(200);
        expect(tooFew.users).toEqual([{ id: "user-000", displayName: "User 000", teamIds: [] }]);
        expect(fraction.users).toHaveLength(2);
        expect(notFinite.users).toHaveLength(50);
    });

    describe("team filter (R286)", () => {
        it("lists the users of one team, asking for them with the team filter", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(list).toEqual({
                users: [{ id: "user-anna", displayName: "Anna Adams", teamIds: [REVIEW_TEAM_ID] }],
                missingIds: []
            });
            expect(users.calls).toEqual([
                { input: { where: { teams_in: [REVIEW_TEAM_ID] } }, authorizationEnabled: false }
            ]);
        });

        it("matches a user who is in any of the teams and de-duplicates the team ids", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const both = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID] })
            );
            const repeated = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID, REVIEW_TEAM_ID] })
            );

            expect(both.users.map(user => user.id)).toEqual(["user-anna", "user-cara"]);
            expect(repeated.users.map(user => user.id)).toEqual(["user-anna"]);
            expect(users.calls[1].input).toEqual({ where: { teams_in: [REVIEW_TEAM_ID] } });
        });

        it("reports every team of a user, also teams outside the filter", async () => {
            const members: FakeUser[] = [
                {
                    id: "user-dora",
                    displayName: "Dora Dunn",
                    teams: [REVIEW_TEAM_ID, OTHER_TEAM_ID]
                }
            ];
            const { listUsers } = await createUsersContext({
                permissions: EDITOR,
                users: members
            });

            const list = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(list.users).toEqual([
                {
                    id: "user-dora",
                    displayName: "Dora Dunn",
                    teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID]
                }
            ]);
        });

        it("combines the team filter with the search", async () => {
            const { listUsers } = await createUsersContext({ permissions: EDITOR });

            const found = expectOk(
                await listUsers.execute({
                    teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID],
                    search: "ADAMS"
                })
            );
            const outside = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID], search: "cara" })
            );

            expect(found.users.map(user => user.id)).toEqual(["user-anna"]);
            expect(outside.users).toEqual([]);
        });

        it("applies the limit rules to the team members", async () => {
            const members = Array.from({ length: 205 }, (_, index): FakeUser => {
                const number = String(index).padStart(3, "0");
                return {
                    id: `user-${number}`,
                    displayName: `User ${number}`,
                    teams: [REVIEW_TEAM_ID]
                };
            });
            const { listUsers } = await createUsersContext({
                permissions: EDITOR,
                users: members
            });

            const byDefault = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));
            const limited = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID], limit: 2 })
            );
            const tooMany = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID], limit: 500 })
            );

            expect(byDefault.users).toHaveLength(50);
            expect(limited.users.map(user => user.id)).toEqual(["user-000", "user-001"]);
            expect(tooMany.users).toHaveLength(200);
        });

        it("matches no user and makes no lookup for an empty team filter", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(await listUsers.execute({ teamIds: [] }));

            expect(list).toEqual({ users: [], missingIds: [] });
            expect(users.calls).toEqual([]);
        });

        it("lists everyone when the team filter is null", async () => {
            const { listUsers } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(await listUsers.execute({ teamIds: null }));

            expect(list.users).toHaveLength(3);
        });

        it("ignores the team filter for an ids lookup, so a user who left the teams still resolves (D117)", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(
                await listUsers.execute({
                    ids: ["user-cara", "user-gone"],
                    teamIds: [REVIEW_TEAM_ID],
                    search: "nobody",
                    limit: 1
                })
            );

            expect(list).toEqual({
                users: [{ id: "user-cara", displayName: "Cara Clark", teamIds: [OTHER_TEAM_ID] }],
                missingIds: ["user-gone"]
            });
            expect(users.calls).toEqual([
                {
                    input: { where: { id_in: ["user-cara", "user-gone"] } },
                    authorizationEnabled: false
                }
            ]);
        });
    });

    describe("teams off (Q49, Q58, R286, R287)", () => {
        it("lists users with empty team ids and exposes no team data", async () => {
            const { listUsers, users } = await createUsersContext({
                permissions: EDITOR,
                teams: false
            });

            const list = expectOk(await listUsers.execute());

            expect(list).toEqual({
                users: [
                    { id: "user-anna", displayName: "Anna Adams", teamIds: [] },
                    { id: "user-bob", displayName: "bob Brown", teamIds: [] },
                    { id: "user-cara", displayName: "Cara Clark", teamIds: [] }
                ],
                missingIds: []
            });
            expect(JSON.stringify(list)).not.toContain(REVIEW_TEAM_ID);
            expect(JSON.stringify(list)).not.toContain(OTHER_TEAM_ID);
            expect(users.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
        });

        it("returns no users and makes no lookup for a request with team ids", async () => {
            const { listUsers, users } = await createUsersContext({
                permissions: EDITOR,
                teams: false
            });

            const list = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(list).toEqual({ users: [], missingIds: [] });
            expect(users.calls).toEqual([]);
        });

        it("still resolves an ids lookup, with empty team ids", async () => {
            const { listUsers } = await createUsersContext({ permissions: EDITOR, teams: false });

            const list = expectOk(
                await listUsers.execute({ ids: ["user-anna", "user-gone"], teamIds: ["team-x"] })
            );

            expect(list).toEqual({
                users: [{ id: "user-anna", displayName: "Anna Adams", teamIds: [] }],
                missingIds: ["user-gone"]
            });
        });

        it("reads the switch on every request, not at registration (R287)", async () => {
            let teamsOn = true;
            const { listUsers } = await createUsersContext({
                permissions: EDITOR,
                teams: () => teamsOn
            });

            const on = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));
            teamsOn = false;
            const off = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));
            teamsOn = true;
            const onAgain = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(on.users.map(user => user.id)).toEqual(["user-anna"]);
            expect(off.users).toEqual([]);
            expect(onAgain.users.map(user => user.id)).toEqual(["user-anna"]);
        });

        it("returns the persistence error when the flag read throws (R87)", async () => {
            const { listUsers, users } = await createUsersContext({
                permissions: EDITOR,
                setup: container => {
                    container.registerDecorator(
                        FeatureFlags.createDecorator({
                            decorator: ThrowingFeatureFlags,
                            dependencies: []
                        })
                    );
                }
            });

            const result = await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] });

            expect(result.error.code).toBe("Workflows/Workflow/Lookup");
            expect(hasErrorSource(result.error) && result.error.source.message).toBe(
                "Flags are down."
            );
            expect(users.calls).toEqual([]);
        });
    });

    it("resolves ids in the given order and reports the missing ones (D117)", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(
            await listUsers.execute({
                ids: ["user-cara", "user-gone", "user-anna", "user-cara"],
                search: "nobody",
                limit: 1
            })
        );

        expect(list).toEqual({
            users: [
                { id: "user-cara", displayName: "Cara Clark", teamIds: [OTHER_TEAM_ID] },
                { id: "user-anna", displayName: "Anna Adams", teamIds: [REVIEW_TEAM_ID] }
            ],
            missingIds: ["user-gone"]
        });
        expect(users.calls).toEqual([
            {
                input: { where: { id_in: ["user-cara", "user-gone", "user-anna"] } },
                authorizationEnabled: false
            }
        ]);
    });

    it("refuses more than 200 ids without a lookup (R126)", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });
        const ids = Array.from({ length: 201 }, (_, index) => `user-${index}`);

        const result = await listUsers.execute({ ids });
        // Counted after de-duplication: 200 distinct ids plus repeats are allowed.
        const deduplicated = await listUsers.execute({ ids: [...ids.slice(0, 200), "user-0"] });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many user ids.");
        expect(result.error.data).toEqual({
            stepId: null,
            field: null,
            workflowId: null,
            ruleId: null
        });
        expect(deduplicated.isOk()).toBe(true);
        expect(users.calls).toHaveLength(1);
    });

    it("answers an empty ids list without a lookup", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute({ ids: [] }));

        expect(list).toEqual({ users: [], missingIds: [] });
        expect(users.calls).toEqual([]);
    });

    it("allows a full-access permission set", async () => {
        const { listUsers } = await createUsersContext({
            permissions: [{ name: "workflows.*" }]
        });

        const list = await listUsers.execute();

        expect(list.isOk()).toBe(true);
    });

    it("refuses a user without editor and does not list users", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: REASSIGNER });

        const result = await listUsers.execute({ search: "anna" });
        const scoped = await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list users" });
        expect(scoped.error.code).toBe("Workflows/NotAuthorized");
        expect(users.calls).toEqual([]);
    });

    it("refuses an anonymous identity and does not list users", async () => {
        const { container, listUsers, users } = await createUsersContext();
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            listUsers.execute()
        );

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(users.calls).toEqual([]);
    });

    it("returns the persistence error when the lookup fails (R87)", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });
        users.failuresLeft = 1;

        const failed = await listUsers.execute();

        expect(failed.error.code).toBe("Workflows/Workflow/Lookup");
        expect(hasErrorSource(failed.error) && failed.error.source.message).toBe(
            "Storage is not available."
        );
    });

    it("returns the persistence error when the lookup throws (R87)", async () => {
        const { listUsers } = await createUsersContext({
            permissions: EDITOR,
            listUsers: new ThrowingListUsers()
        });

        const thrown = await listUsers.execute({ ids: ["user-anna"] });

        expect(thrown.error.code).toBe("Workflows/Workflow/Lookup");
        expect(hasErrorSource(thrown.error) && thrown.error.source.message).toBe("Users are down.");
    });

    it("returns the persistence error when the permission check throws (R87)", async () => {
        const { listUsers, users } = await createUsersContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listUsers.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Lookup");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "Permissions are down."
        );
        expect(users.calls).toEqual([]);
    });
});
