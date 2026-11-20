import { describe, expect, it } from "vitest";
import { useHandler } from "./utils/useHandler";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import {
    GetUserEntryAccessUseCase,
    GetUserFolderAccessUseCase,
    ListEntryAccessUseCase,
    ListFolderAccessUseCase,
    ListUserFolderAccessUseCase
} from "~/features/flp/ListFolderAccess/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateRoleUseCase } from "@webiny/api-core/features/security/roles/CreateRole/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { CreateUserUseCase } from "@webiny/api-core/features/users/CreateUser/index.js";
import type { Folder } from "~/folder/folder.types";
import type { FolderPermission } from "~/flp/flp.types";
import { FlpFactory } from "~/features/flp/shared/abstractions.js";

const type = "access-folders";

describe("Who has access to a folder", () => {
    const { handler } = useHandler();
    const { handler: restrictedHandler } = useHandler({ permissions: [] });

    const setup = async () => {
        const context = await handler();
        const resolve = <T>(abstraction: { readonly __type?: T } | any) =>
            context.container.resolve(abstraction) as any;

        const fullRole = (
            await resolve(CreateRoleUseCase).execute({
                name: "Full",
                slug: "full",
                description: "",
                permissions: [{ name: "*" }]
            })
        ).value;
        const contentRole = (
            await resolve(CreateRoleUseCase).execute({
                name: "Content",
                slug: "content",
                description: "",
                permissions: [{ name: "cms.*" }]
            })
        ).value;
        const editors = (
            await resolve(CreateTeam).execute({
                name: "Editors",
                slug: "editors",
                description: "",
                roles: [contentRole.id]
            })
        ).value;

        const createUser = async (id: string, input: Record<string, unknown> = {}) => {
            const result = await resolve(CreateUserUseCase).execute({
                id,
                email: `${id}@webiny.local`,
                displayName: id,
                ...input
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        };
        await createUser("alice", { roles: [contentRole.id] });
        await createUser("bob", { teams: [editors.id] });
        await createUser("carol", { roles: [fullRole.id] });
        await createUser("dave", { teams: [editors.id] });
        await createUser("erin", { roles: [contentRole.id] });

        const createFolder = async (
            slug: string,
            parentId: string | null,
            permissions?: FolderPermission[]
        ): Promise<Folder> => {
            const result = await resolve(CreateFolderUseCase).execute({
                type,
                title: slug,
                slug,
                parentId,
                ...(permissions ? { permissions } : {})
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        };

        return { context, editors, createFolder };
    };

    it("should list the users and teams with access, and how they got it", async () => {
        const { context, editors, createFolder } = await setup();

        const parent = await createFolder("parent", null, [
            { target: "team:editors", level: "editor" },
            { target: "admin:alice", level: "viewer" },
            // dave is in the editors team, but no-access wins.
            { target: "admin:dave", level: "no-access" }
        ]);
        const child = await createFolder("child", parent.id);

        const result = await context.container.resolve(ListFolderAccessUseCase).execute(child.id);
        expect(result.isOk()).toBe(true);
        const access = result.value;

        expect(access.restricted).toBe(true);
        const users = Object.fromEntries(access.users.map(user => [user.id, user]));
        expect(users.alice).toMatchObject({ level: "viewer", via: `parent:${parent.id}` });
        expect(users.bob).toMatchObject({ level: "editor", via: "team:editors" });
        expect(users.carol).toMatchObject({ level: "owner", via: "role:full-access" });
        expect(users.dave).toBeUndefined();
        expect(users.erin).toBeUndefined();

        expect(access.teams).toEqual([
            {
                id: editors.id,
                name: "Editors",
                slug: "editors",
                level: "editor",
                inheritedFrom: `parent:${parent.id}`
            }
        ]);
    });

    it("should report no restriction for a folder without permissions, or no folder", async () => {
        const { context, createFolder } = await setup();
        const open = await createFolder("open", null);
        const listAccess = context.container.resolve(ListFolderAccessUseCase);

        for (const folderId of [open.id, null]) {
            const result = await listAccess.execute(folderId);
            expect(result.value).toEqual({ folderId, restricted: false, users: [], teams: [] });
        }
    });

    it("should refuse an identity that cannot manage the folder's permissions", async () => {
        const { createFolder } = await setup();
        const folder = await createFolder("private", null, [
            { target: "team:editors", level: "editor" }
        ]);

        const restricted = await restrictedHandler();
        const result = await restricted.container
            .resolve(ListFolderAccessUseCase)
            .execute(folder.id);
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("NOT_AUTHORIZED");
    });
});

describe("Which folders a user can access", () => {
    const { handler } = useHandler();
    const { handler: restrictedHandler } = useHandler({ permissions: [] });

    it("should list each user's folders with level and source", async () => {
        const context = await handler();
        const resolve = (abstraction: any) => context.container.resolve(abstraction) as any;

        const fullRole = (
            await resolve(CreateRoleUseCase).execute({
                name: "Full",
                slug: "full",
                description: "",
                permissions: [{ name: "*" }]
            })
        ).value;
        const editors = (
            await resolve(CreateTeam).execute({
                name: "Editors",
                slug: "editors",
                description: "",
                roles: []
            })
        ).value;
        for (const [id, input] of [
            ["alice", {}],
            ["bob", { teams: [editors.id] }],
            ["carol", { roles: [fullRole.id] }],
            ["dave", { teams: [editors.id] }]
        ] as const) {
            await resolve(CreateUserUseCase).execute({
                id,
                email: `${id}@webiny.local`,
                displayName: id,
                ...input
            });
        }

        const createFolder = async (
            slug: string,
            parentId: string | null,
            permissions?: FolderPermission[]
        ): Promise<Folder> => {
            const result = await resolve(CreateFolderUseCase).execute({
                type,
                title: slug,
                slug,
                parentId,
                ...(permissions ? { permissions } : {})
            });
            return result.value;
        };
        const parent = await createFolder("parent", null, [
            { target: "team:editors", level: "editor" },
            { target: "admin:alice", level: "viewer" },
            { target: "admin:dave", level: "no-access" }
        ]);
        const child = await createFolder("child", parent.id);
        const open = await createFolder("open", null);

        const listFor = async (userId: string, parentId?: string) => {
            const result = await resolve(ListUserFolderAccessUseCase).execute({
                userId,
                type,
                ...(parentId ? { parentId } : {})
            });
            expect(result.isOk()).toBe(true);
            return result.value.folders.map((folder: any) => [folder.id, folder.level, folder.via]);
        };

        // Sorted by path: root/open, root/parent, root/parent/child.
        expect(await listFor("alice")).toEqual([
            [open.id, "public", "public"],
            [parent.id, "viewer", "direct"],
            [child.id, "viewer", `parent:${parent.id}`]
        ]);
        expect(await listFor("bob")).toEqual([
            [open.id, "public", "public"],
            [parent.id, "editor", "team:editors"],
            [child.id, "editor", "team:editors"]
        ]);
        expect(await listFor("carol")).toEqual([
            [open.id, "owner", "role:full-access"],
            [parent.id, "owner", "role:full-access"],
            [child.id, "owner", "role:full-access"]
        ]);
        // no-access on the parent, inherited by the child, wins over the team's editor grant.
        expect(await listFor("dave")).toEqual([[open.id, "public", "public"]]);

        // Scoped to one parent's children.
        expect(await listFor("alice", parent.id)).toEqual([
            [child.id, "viewer", `parent:${parent.id}`]
        ]);
    });

    it("should include the folders granted to the user in code", async () => {
        const context = await handler();
        context.container.registerInstance(FlpFactory, {
            async execute() {
                return [
                    {
                        type,
                        path: "/coded/*",
                        permissions: [{ user: "frank", level: "viewer" as const }]
                    }
                ];
            }
        });
        const resolve = (abstraction: any) => context.container.resolve(abstraction) as any;
        await resolve(CreateUserUseCase).execute({
            id: "frank",
            email: "frank@webiny.local",
            displayName: "frank"
        });

        const createFolder = async (
            slug: string,
            parentId: string | null,
            permissions?: FolderPermission[]
        ): Promise<Folder> => {
            const result = await resolve(CreateFolderUseCase).execute({
                type,
                title: slug,
                slug,
                parentId,
                ...(permissions ? { permissions } : {})
            });
            return result.value;
        };
        const restricted = [{ target: "team:editors", level: "editor" } as FolderPermission];
        const coded = await createFolder("coded", null, restricted);
        const inner = await createFolder("inner", coded.id);
        await createFolder("locked", null, restricted);

        const result = await resolve(ListUserFolderAccessUseCase).execute({
            userId: "frank",
            type
        });
        expect(result.value.folders.map((folder: any) => [folder.id, folder.level])).toEqual([
            [coded.id, "viewer"],
            [inner.id, "viewer"]
        ]);
    });

    it("should refuse to answer about another user without full access", async () => {
        await handler();
        const restricted = await restrictedHandler();
        const result = await restricted.container
            .resolve(ListUserFolderAccessUseCase)
            .execute({ userId: "someone-else", type });
        expect(result.isFail()).toBe(true);
        expect((result.error as any).code).toBe("NOT_AUTHORIZED");
    });
});

describe("Who has access to an entry", () => {
    const { handler } = useHandler();

    it("should report the access of the folder the entry is in", async () => {
        const gql = useGraphQlHandler({ identity: { id: "1", type: "admin", displayName: "A" } });
        const modelGroup = await gql.cms.createTestModelGroup();
        const gqlModel = await gql.cms.createBasicModel({ modelGroup: modelGroup.id });

        const [folderResponse] = await gql.aco.createFolder({
            data: {
                title: "Restricted",
                slug: "restricted",
                type: `cms:${gqlModel.modelId}`,
                permissions: [{ target: "team:editors", level: "viewer" }]
            }
        });
        const folder = folderResponse.data.aco.createFolder.data;

        const createEntry = async (location?: { folderId: string }) => {
            const [response] = await gql.cms.createEntry(gqlModel, {
                data: {
                    values: { title: "Entry" },
                    ...(location ? { wbyAco_location: location } : {})
                }
            });
            return response.data.createBasicTestModel.data;
        };
        const inFolder = await createEntry({ folderId: folder.id });
        const unfiled = await createEntry();

        const context = await handler();
        const model = (await context.container.resolve(GetModelUseCase).execute(gqlModel.modelId))
            .value;
        const getAccess = async (entryId: string) => {
            const result = await context.container
                .resolve(ListEntryAccessUseCase)
                .execute(model, entryId);
            expect(result.isOk()).toBe(true);
            return result.value;
        };

        await expect(getAccess(inFolder.entryId)).resolves.toMatchObject({
            folderId: folder.id,
            restricted: true,
            teams: [{ slug: "editors", level: "viewer" }]
        });
        await expect(getAccess(unfiled.entryId)).resolves.toMatchObject({
            restricted: false,
            users: [],
            teams: []
        });
    });
});

describe("Can a user access an entry", () => {
    const { handler } = useHandler();
    const { handler: restrictedHandler } = useHandler({ permissions: [] });

    it("should answer for one user, with level and source", async () => {
        const gql = useGraphQlHandler({ identity: { id: "1", type: "admin", displayName: "A" } });
        const modelGroup = await gql.cms.createTestModelGroup();
        const gqlModel = await gql.cms.createBasicModel({ modelGroup: modelGroup.id });
        const { modelId } = gqlModel;

        const context = await handler();
        const resolve = (abstraction: any) => context.container.resolve(abstraction) as any;
        const editors = (
            await resolve(CreateTeam).execute({
                name: "Editors",
                slug: "editors",
                description: "",
                roles: []
            })
        ).value;
        for (const [id, input] of [
            ["alice", {}],
            ["bob", { teams: [editors.id] }],
            ["dave", { teams: [editors.id] }]
        ] as const) {
            await resolve(CreateUserUseCase).execute({
                id,
                email: `${id}@webiny.local`,
                displayName: id,
                ...input
            });
        }

        const createFolder = async (
            slug: string,
            parentId: string | null,
            permissions?: FolderPermission[]
        ): Promise<Folder> => {
            const result = await resolve(CreateFolderUseCase).execute({
                type: `cms:${modelId}`,
                title: slug,
                slug,
                parentId,
                ...(permissions ? { permissions } : {})
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        };
        const parent = await createFolder("parent", null, [
            { target: "team:editors", level: "editor" },
            { target: "admin:alice", level: "viewer" },
            { target: "admin:dave", level: "no-access" }
        ]);
        const child = await createFolder("child", parent.id);
        const open = await createFolder("open", null);

        const createEntry = async (folderId?: string) => {
            const [response] = await gql.cms.createEntry(gqlModel, {
                data: {
                    values: { title: "Entry" },
                    ...(folderId ? { wbyAco_location: { folderId } } : {})
                }
            });
            return response.data.createBasicTestModel.data.entryId as string;
        };
        const inChild = await createEntry(child.id);
        const inOpen = await createEntry(open.id);
        const unfiled = await createEntry();

        const model = (await resolve(GetModelUseCase).execute(modelId)).value;
        const check = async (userId: string, entryId: string) => {
            const result = await resolve(GetUserEntryAccessUseCase).execute({
                userId,
                model,
                entryId
            });
            expect(result.isOk()).toBe(true);
            return result.value;
        };

        await expect(check("alice", inChild)).resolves.toEqual({
            userId: "alice",
            folderId: child.id,
            restricted: true,
            canAccess: true,
            level: "viewer",
            via: `parent:${parent.id}`
        });
        await expect(check("bob", inChild)).resolves.toMatchObject({
            canAccess: true,
            level: "editor",
            via: "team:editors"
        });
        // no-access on the parent, inherited by the child, wins over the team's editor grant.
        await expect(check("dave", inChild)).resolves.toEqual({
            userId: "dave",
            folderId: child.id,
            restricted: true,
            canAccess: false
        });
        // A folder without permissions, or no folder: no folder-level restriction.
        await expect(check("dave", inOpen)).resolves.toMatchObject({
            folderId: open.id,
            restricted: false,
            canAccess: true
        });
        // An entry created without a folder is in the root folder.
        await expect(check("dave", unfiled)).resolves.toMatchObject({
            folderId: "root",
            restricted: false,
            canAccess: true
        });

        // The folder check on its own.
        const folderResult = await resolve(GetUserFolderAccessUseCase).execute({
            userId: "alice",
            folderId: parent.id
        });
        expect(folderResult.value).toMatchObject({
            canAccess: true,
            level: "viewer",
            via: "direct"
        });

        // An unknown user is an error, not "no access".
        const unknown = await resolve(GetUserEntryAccessUseCase).execute({
            userId: "nobody",
            model,
            entryId: inChild
        });
        expect(unknown.isFail()).toBe(true);
    });

    it("should refuse to answer about another user without full access", async () => {
        await handler();
        const restricted = await restrictedHandler();
        const result = await restricted.container
            .resolve(GetUserFolderAccessUseCase)
            .execute({ userId: "someone-else", folderId: "any" });
        expect(result.isFail()).toBe(true);
        expect((result.error as any).code).toBe("NOT_AUTHORIZED");
    });
});
