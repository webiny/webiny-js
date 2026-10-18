import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, OTHER_TEAM_ID, REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
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

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface UsersContextParams extends CmsTestHandlerParams {
    users?: FakeUser[];
    listUsers?: ListUsersUseCase.Interface;
}

const createUsersContext = async (params: UsersContextParams = {}) => {
    const users = new FakeListUsers(params.users ?? USERS);
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
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

describe("ListWorkflowUsersUseCase (D48, D117, R123)", () => {
    it("lists every user as id and display name, sorted by display name, without authorization", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute());

        expect(list).toEqual({
            users: [
                { id: "user-anna", displayName: "Anna Adams" },
                { id: "user-bob", displayName: "bob Brown" },
                { id: "user-cara", displayName: "Cara Clark" }
            ],
            missingIds: []
        });
        expect(users.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
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
        expect(byDefault.users[0]).toEqual({ id: "user-000", displayName: "User 000" });
        expect(tooMany.users).toHaveLength(200);
        expect(tooFew.users).toEqual([{ id: "user-000", displayName: "User 000" }]);
        expect(fraction.users).toHaveLength(2);
        expect(notFinite.users).toHaveLength(50);
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
                { id: "user-cara", displayName: "Cara Clark" },
                { id: "user-anna", displayName: "Anna Adams" }
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
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
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

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list users" });
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

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
    });

    it("returns the persistence error when the lookup throws (R87)", async () => {
        const { listUsers } = await createUsersContext({
            permissions: EDITOR,
            listUsers: new ThrowingListUsers()
        });

        const thrown = await listUsers.execute({ ids: ["user-anna"] });

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Users are down.");
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

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
        expect(users.calls).toEqual([]);
    });
});
