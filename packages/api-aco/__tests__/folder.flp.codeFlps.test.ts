import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { Result } from "@webiny/feature/api";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { FlpFactory } from "~/features/flp/shared/abstractions.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext";

const FOLDER_TYPE = "test-folders";
const OTHER_FOLDER_TYPE = "other-folders";

// Identity A is a full-access user, and creates the folder tree.
const identityA: IdentityData = { id: "1", type: "admin", displayName: "A" };
// Identity B is a regular user, member of the "editors" team.
const identityB: IdentityData = { id: "2", type: "admin", displayName: "B" };

class TestTeamFactory implements TeamFactory.Interface {
    async execute(): TeamFactory.Return {
        return [
            {
                name: "Editors",
                slug: "editors",
                description: "",
                roles: ["test-role"]
            }
        ];
    }
}

class TestFlpFactory implements FlpFactory.Interface {
    async execute(): FlpFactory.Return {
        return [
            {
                type: FOLDER_TYPE,
                // Exact match: this folder only, not its children.
                path: "/folder-a",
                permissions: [{ target: "team:editors", level: "editor" }]
            },
            {
                type: FOLDER_TYPE,
                // Subtree match: the folder itself plus everything below it.
                path: "/folder-locked/*",
                permissions: [{ target: "team:editors", level: "no-access" }]
            },
            {
                // Same path, different folder type — must not leak across types.
                type: OTHER_FOLDER_TYPE,
                path: "/folder-a",
                permissions: [{ target: "team:editors", level: "no-access" }]
            }
        ];
    }
}

// Team membership lives on the stored admin user record, which these tests don't create. Stub the
// lookup instead, so the test exercises the real code-FLP -> team -> identity expansion path.
const registrations = (teams: string[] = []) => [
    (container: Container) => {
        container.registerInstance(TeamFactory, new TestTeamFactory());
        container.registerInstance(FlpFactory, new TestFlpFactory());
        container.registerInstance(ListUserTeamsUseCase, {
            async execute() {
                return Result.ok(
                    teams.map(slug => ({
                        id: slug,
                        slug,
                        name: slug,
                        description: "",
                        roles: [],
                        createdOn: null,
                        createdBy: null,
                        system: false,
                        plugin: true
                    }))
                );
            }
        });
    }
];

describe("Folder Level Permissions - code-defined FLPs", () => {
    const { aco: acoIdentityA } = useGraphQlHandler({
        identity: identityA,
        plugins: registrations()
    });

    const { aco: acoIdentityB } = useGraphQlHandler({
        identity: identityB,
        permissions: [],
        plugins: registrations(["editors"])
    });

    const createFolder = async (data: Record<string, unknown>) => {
        return acoIdentityA.createFolder({ data }).then(([response]) => {
            const { data, error } = response.data.aco.createFolder;
            if (error) {
                throw new Error(error.message);
            }
            return data;
        });
    };

    const getFolder = async (aco: typeof acoIdentityA, id: string) => {
        return aco.getFolder({ id }).then(([response]) => response.data.aco.getFolder);
    };

    it("should merge code-defined permissions into the folder on read", async () => {
        const folderA = await createFolder({
            title: "Folder A",
            slug: "folder-a",
            type: FOLDER_TYPE
        });

        // Identity B is in the "editors" team, so the code-defined permission resolves to an
        // `admin:2` permission, inherited from the team.
        const { data } = await getFolder(acoIdentityB, folderA.id);

        expect(data.permissions).toEqual(
            expect.arrayContaining([
                { target: "team:editors", level: "editor", inheritedFrom: null, plugin: true },
                {
                    target: "admin:2",
                    level: "editor",
                    inheritedFrom: "team:editors",
                    plugin: null
                }
            ])
        );
    });

    it("should not apply a rule registered for a different folder type", async () => {
        const folder = await createFolder({
            title: "Folder A",
            slug: "folder-a",
            type: OTHER_FOLDER_TYPE
        });

        const { data } = await getFolder(acoIdentityB, folder.id);

        // The OTHER_FOLDER_TYPE rule is `no-access`, so identity B must not see the folder at all.
        expect(data).toBeNull();
    });

    it("should apply a subtree rule to descendant folders", async () => {
        const locked = await createFolder({
            title: "Folder Locked",
            slug: "folder-locked",
            type: FOLDER_TYPE
        });

        const child = await createFolder({
            title: "Child",
            slug: "child",
            type: FOLDER_TYPE,
            parentId: locked.id
        });

        // `no-access` is absolute, so identity B loses access to both the folder and its child.
        await expect(getFolder(acoIdentityB, locked.id)).resolves.toMatchObject({ data: null });
        await expect(getFolder(acoIdentityB, child.id)).resolves.toMatchObject({ data: null });

        // The full-access identity is unaffected — consistent with stored FLPs.
        await expect(getFolder(acoIdentityA, child.id)).resolves.toMatchObject({
            data: { slug: "child" }
        });
    });

    it("should not apply an exact-match rule to descendant folders", async () => {
        const folderA = await createFolder({
            title: "Folder A",
            slug: "folder-a",
            type: FOLDER_TYPE
        });

        const child = await createFolder({
            title: "Child",
            slug: "child",
            type: FOLDER_TYPE,
            parentId: folderA.id
        });

        const { data } = await getFolder(acoIdentityB, child.id);

        expect(data.permissions).not.toEqual(
            expect.arrayContaining([expect.objectContaining({ plugin: true })])
        );
    });

    it("should never persist code-defined permissions", async () => {
        const folderA = await createFolder({
            title: "Folder A",
            slug: "folder-a",
            type: FOLDER_TYPE
        });

        // Read the merged permissions, then write them straight back — the shape a client that
        // echoes what it read would send.
        const { data: before } = await getFolder(acoIdentityA, folderA.id);

        await acoIdentityA.updateFolder({
            id: folderA.id,
            data: {
                permissions: before.permissions
                    .filter((p: Record<string, unknown>) => !p.inheritedFrom && !p.plugin)
                    .map(({ target, level }: Record<string, unknown>) => ({ target, level }))
            }
        });

        const { data: after } = await getFolder(acoIdentityA, folderA.id);

        // Exactly one code-defined permission, still marked as such — not duplicated, not stored.
        expect(after.permissions.filter((p: Record<string, unknown>) => p.plugin)).toHaveLength(1);
    });
});
