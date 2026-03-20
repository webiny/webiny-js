import { describe, it, expect } from "vitest";
import { ContextPlugin } from "@webiny/api";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

const FOLDER_TYPE = "test-folders";

const identityA: IdentityData = { id: "1", type: "admin", displayName: "A" };

class TestTeamFactory implements TeamFactory.Interface {
    execute(): TeamFactory.Return {
        return [
            {
                name: "Test Team 1",
                slug: "test-team-1",
                description: "",
                roles: ["test-role"]
            },
            {
                name: "Test Team 2",
                slug: "test-team-2",
                description: "",
                roles: ["test-role"]
            }
        ];
    }
}

describe("Folder Level Permissions - Inheritance", () => {
    const { aco } = useGraphQlHandler({
        identity: identityA,
        plugins: [
            new ContextPlugin<ApiCoreContext>(async context => {
                context.container.registerInstance(TeamFactory, new TestTeamFactory());
            })
        ]
    });

    it("child folders should inherit parent permissions", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE,
                    permissions: [
                        { level: "viewer", target: `admin:2` },
                        { level: "viewer", target: `team:test-team-1` },
                        { level: "editor", target: `team:test-team-2` }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const refetchedFolderA = await aco.getFolder({ id: folderA.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderA).toMatchObject({
            slug: "folder-a",
            permissions: [
                { target: "admin:1", level: "owner", inheritedFrom: "role:full-access" },
                { target: "admin:2", level: "viewer", inheritedFrom: null },
                { target: "team:test-team-1", level: "viewer", inheritedFrom: null },
                { target: "team:test-team-2", level: "editor", inheritedFrom: null }
            ]
        });

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const refetchedFolderB = await aco.getFolder({ id: folderB.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        const folderC = await aco
            .createFolder({
                data: {
                    title: "Folder C",
                    slug: "folder-c",
                    type: FOLDER_TYPE,
                    parentId: folderB.id
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderB).toMatchObject({
            slug: "folder-b",
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "admin:2",
                    level: "viewer",
                    inheritedFrom: `parent:${folderA.id}`
                },
                {
                    target: "team:test-team-1",
                    level: "viewer",
                    inheritedFrom: `parent:${folderA.id}`
                },
                {
                    target: "team:test-team-2",
                    level: "editor",
                    inheritedFrom: `parent:${folderA.id}`
                }
            ]
        });

        expect(refetchedFolderC).toMatchObject({
            slug: "folder-c",
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "admin:2",
                    level: "viewer",
                    inheritedFrom: `parent:${folderB.id}`
                },
                {
                    target: "team:test-team-1",
                    level: "viewer",
                    inheritedFrom: `parent:${folderB.id}`
                },
                {
                    target: "team:test-team-2",
                    level: "editor",
                    inheritedFrom: `parent:${folderB.id}`
                }
            ]
        });
    });

    it("overriding inherited permissions must be possible", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE,
                    permissions: [
                        { level: "viewer", target: `team:test-team-1` },
                        { level: "editor", target: `team:test-team-2` }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id,
                    permissions: [{ level: "viewer", target: `team:test-team-2` }]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const refetchedFolderB = await aco.getFolder({ id: folderB.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderB).toMatchObject({
            slug: "folder-b",
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "team:test-team-2",
                    level: "viewer",
                    inheritedFrom: null
                },
                {
                    target: "team:test-team-1",
                    level: "viewer",
                    inheritedFrom: `parent:${folderA.id}`
                }
            ]
        });
    });

    it("overriding `no-access` permissions must not be possible", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE,
                    permissions: [
                        { level: "viewer", target: `team:test-team-1` },
                        { level: "editor", target: `team:test-team-2` }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id,
                    permissions: []
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderC = await aco
            .createFolder({
                data: {
                    title: "Folder C",
                    slug: "folder-c",
                    type: FOLDER_TYPE,
                    parentId: folderB.id,
                    permissions: [{ level: "owner", target: `team:test-team-2` }]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        let refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderC).toMatchObject({
            slug: "folder-c",
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "team:test-team-2",
                    level: "owner",
                    inheritedFrom: null
                },
                {
                    target: "team:test-team-1",
                    level: "viewer",
                    inheritedFrom: `parent:${folderB.id}`
                }
            ]
        });

        await aco.updateFolder({
            id: folderB.id,
            data: {
                permissions: [{ level: "no-access", target: `team:test-team-2` }]
            }
        });

        refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderC).toMatchObject({
            slug: "folder-c",
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "team:test-team-2",
                    level: "no-access",
                    inheritedFrom: `parent:${folderB.id}`
                },
                {
                    target: "team:test-team-1",
                    level: "viewer",
                    inheritedFrom: `parent:${folderB.id}`
                }
            ]
        });
    });

    it("removing parent permissions should be reflected in child folders", async () => {
        const folderA = await aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: FOLDER_TYPE,
                    permissions: [
                        { level: "viewer", target: `team:test-team-1` },
                        { level: "editor", target: `team:test-team-2` }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderB = await aco
            .createFolder({
                data: {
                    title: "Folder B",
                    slug: "folder-b",
                    type: FOLDER_TYPE,
                    parentId: folderA.id,
                    permissions: [
                        { level: "viewer", target: `team:test-team-2` },
                        { level: "editor", target: `team:test-team-1` }
                    ]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const folderC = await aco
            .createFolder({
                data: {
                    title: "Folder C",
                    slug: "folder-c",
                    type: FOLDER_TYPE,
                    parentId: folderB.id,
                    permissions: [{ level: "owner", target: `team:test-team-2` }]
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        let refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderC).toMatchObject({
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "team:test-team-2",
                    level: "owner",
                    inheritedFrom: null
                },
                {
                    target: "team:test-team-1",
                    level: "editor",
                    inheritedFrom: `parent:${folderB.id}`
                }
            ]
        });

        await aco.updateFolder({
            id: folderC.id,
            data: {
                permissions: []
            }
        });

        refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderC).toMatchObject({
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "team:test-team-2",
                    level: "viewer",
                    inheritedFrom: `parent:${folderB.id}`
                },
                {
                    target: "team:test-team-1",
                    level: "editor",
                    inheritedFrom: `parent:${folderB.id}`
                }
            ]
        });

        await aco.updateFolder({
            id: folderB.id,
            data: {
                permissions: []
            }
        });

        refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderC).toMatchObject({
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                },
                {
                    target: "team:test-team-1",
                    level: "viewer",
                    inheritedFrom: `parent:${folderB.id}`
                },
                {
                    target: "team:test-team-2",
                    level: "editor",
                    inheritedFrom: `parent:${folderB.id}`
                }
            ]
        });

        await aco.updateFolder({
            id: folderA.id,
            data: {
                permissions: []
            }
        });

        refetchedFolderC = await aco.getFolder({ id: folderC.id }).then(([response]) => {
            return response.data.aco.getFolder.data;
        });

        expect(refetchedFolderC).toMatchObject({
            permissions: [
                {
                    target: "admin:1",
                    level: "owner",
                    inheritedFrom: "role:full-access"
                }
            ]
        });
    });
});
