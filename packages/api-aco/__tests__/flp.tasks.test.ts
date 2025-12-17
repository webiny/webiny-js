import { describe, it, expect, beforeEach, vi } from "vitest";
import { useHandler } from "~tests/utils/useHandler";
import type { Folder } from "~/folder/folder.types";
import { ROOT_FOLDER } from "~/constants";
import { DeleteFlpUseCase } from "~/features/flp/DeleteFlp/index.js";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";

describe("FLP Tasks", () => {
    describe("Folder Level Permissions -  CREATE FLP", () => {
        const { handler } = useHandler();

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should create an FLP record without a parent folder", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);

            const result = await createFolder.execute({
                title: "Folder 1",
                type: "type1",
                slug: "folder1",
                parentId: null
            });

            const folder = result.value;
            const flp = await context.aco.flp.get(folder.id);

            expect(flp).toMatchObject({
                id: folder.id,
                type: "type1",
                slug: "folder1",
                parentId: ROOT_FOLDER,
                path: `${ROOT_FOLDER}/folder1`,
                permissions: []
            });
        });

        it("should create an FLP record with a parent folder", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            const result1 = await createFolder.execute({
                title: "Folder 1",
                type: "type1",
                slug: "folder1",
                parentId: null
            });

            const folder1 = result1.value;
            await updateFolder.execute(folder1.id, {
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer"
                    }
                ]
            });

            const result2 = await createFolder.execute({
                title: "Folder 2",
                type: "type1",
                slug: "folder2",
                parentId: folder1.id
            });

            const folder2 = result2.value;
            const flp = await context.aco.flp.get(folder2.id);

            expect(flp).toMatchObject({
                id: folder2.id,
                type: "type1",
                slug: "folder2",
                parentId: folder1.id,
                path: `${ROOT_FOLDER}/folder1/folder2`,
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer",
                        inheritedFrom: `parent:${folder1.id}`
                    }
                ]
            });
        });
    });

    describe("Folder Level Permissions -  DELETE FLP", () => {
        const { handler } = useHandler();

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should throw an error if the folder is not provided", async () => {
            const context = await handler();
            const deleteFlp = context.container.resolve(DeleteFlpUseCase);

            await expect(deleteFlp.execute(undefined as unknown as Folder)).rejects.toThrow(
                "Missing `folder` from the task input, I can't delete the record from the FLP catalog."
            );
        });

        it("should delete an FLP record successfully", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);

            const result = await createFolder.execute({
                title: "Folder 1",
                type: "type1",
                slug: "folder1",
                parentId: null
            });

            const folder = result.value;

            const flp = await context.aco.flp.get(folder.id);

            expect(flp).toMatchObject({
                id: folder.id,
                type: "type1",
                slug: "folder1",
                parentId: ROOT_FOLDER,
                path: `${ROOT_FOLDER}/folder1`,
                permissions: []
            });

            await context.aco.flp.delete(folder.id);

            const deletedFlp = await context.aco.flp.get(folder.id);

            await expect(deletedFlp).toBeNull();
        });
    });

    describe("Folder Level Permissions -  UPDATE FLP - Simple", () => {
        const { handler } = useHandler();
        const type = "type";

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should update a root folder's permissions", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            const result = await createFolder.execute({
                type,
                title: "Main folder",
                slug: "main-folder",
                parentId: null
            });

            const folder = result.value;

            await updateFolder.execute(folder.id, {
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer"
                    }
                ]
            });

            const flp = await context.aco.flp.get(folder.id);
            expect(flp).toMatchObject({
                id: folder.id,
                type,
                slug: folder.slug,
                parentId: ROOT_FOLDER,
                path: `${ROOT_FOLDER}/${folder.slug}`,
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer"
                    }
                ]
            });
        });

        it("should update a folder's slug and path", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            const result = await createFolder.execute({
                type,
                title: "Folder 1",
                slug: "folder-1",
                parentId: null
            });

            const folder = result.value;

            const updatedFolderResult = await updateFolder.execute(folder.id, {
                slug: "folder-1-updated"
            });

            const updatedFolder = updatedFolderResult.value;

            const flp = await context.aco.flp.get(folder.id);
            expect(flp).toMatchObject({
                id: folder.id,
                type,
                slug: updatedFolder.slug,
                parentId: ROOT_FOLDER,
                path: `${ROOT_FOLDER}/${updatedFolder.slug}`,
                permissions: []
            });
        });

        it("should update a folder's parent and path", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            // Create parent folder
            const parentFolderResult = await createFolder.execute({
                type,
                title: "Parent folder",
                slug: "parent-folder",
                parentId: null
            });

            const parentFolder = parentFolderResult.value;

            // Create child folder
            const childFolderResult = await createFolder.execute({
                type,
                title: "Child folder",
                slug: "child-folder",
                parentId: null
            });

            const childFolder = childFolderResult.value;

            // Update child folder to be under parent
            await updateFolder.execute(childFolder.id, {
                parentId: parentFolder.id
            });

            const flp = await context.aco.flp.get(childFolder.id);
            expect(flp).toMatchObject({
                id: childFolder.id,
                type,
                slug: childFolder.slug,
                parentId: parentFolder.id,
                path: `${ROOT_FOLDER}/${parentFolder.slug}/${childFolder.slug}`,
                permissions: []
            });
        });

        it("should update a folder's permissions and propagate to direct child", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            // Create parent folder
            const parentFolderResult = await createFolder.execute({
                type,
                title: "Parent folder",
                slug: "parent-folder",
                parentId: null
            });

            const parentFolder = parentFolderResult.value;

            // Create child folder
            const childFolderResult = await createFolder.execute({
                type,
                title: "Child folder",
                slug: "child-folder",
                parentId: parentFolder.id
            });

            const childFolder = childFolderResult.value;

            // Update parent folder with new permissions
            await updateFolder.execute(parentFolder.id, {
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer"
                    }
                ]
            });

            // Check parent folder
            const parentFlp = await context.aco.flp.get(parentFolder.id);
            expect(parentFlp).toMatchObject({
                id: parentFolder.id,
                type,
                slug: parentFolder.slug,
                parentId: ROOT_FOLDER,
                path: `${ROOT_FOLDER}/${parentFolder.slug}`,
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer"
                    }
                ]
            });

            // Check child folder
            const childFlp = await context.aco.flp.get(childFolder.id);
            expect(childFlp).toMatchObject({
                id: childFolder.id,
                type,
                slug: childFolder.slug,
                parentId: parentFolder.id,
                path: `${ROOT_FOLDER}/${parentFolder.slug}/${childFolder.slug}`,
                permissions: [
                    {
                        target: "admin:1234",
                        level: "viewer",
                        inheritedFrom: `parent:${parentFolder.id}`
                    }
                ]
            });

            // Update child folder with its own permissions
            await updateFolder.execute(childFolder.id, {
                permissions: [
                    {
                        target: "admin:5678",
                        level: "editor"
                    }
                ]
            });

            {
                // Check child folder
                const updatedChildFlp = await context.aco.flp.get(childFolder.id);
                expect(updatedChildFlp).toMatchObject({
                    id: childFolder.id,
                    type,
                    slug: childFolder.slug,
                    parentId: parentFolder.id,
                    permissions: [
                        {
                            target: "admin:5678",
                            level: "editor"
                        },
                        {
                            target: "admin:1234",
                            level: "viewer",
                            inheritedFrom: `parent:${parentFolder.id}`
                        }
                    ]
                });
            }

            // Update the parent folder removing all permissions
            await updateFolder.execute(parentFolder.id, {
                permissions: []
            });

            // Check parent folder
            const updatedParentFlp = await context.aco.flp.get(parentFolder.id);
            expect(updatedParentFlp).toMatchObject({
                id: parentFolder.id,
                type,
                slug: parentFolder.slug,
                parentId: ROOT_FOLDER,
                permissions: []
            });

            {
                // Check child folder
                const updatedChildFlp = await context.aco.flp.get(childFolder.id);
                expect(updatedChildFlp).toMatchObject({
                    id: childFolder.id,
                    type,
                    slug: childFolder.slug,
                    parentId: parentFolder.id,
                    permissions: [
                        {
                            target: "admin:5678",
                            level: "editor"
                        }
                    ]
                });
            }
        });
    });

    /**
     * Folder Structures Used in Tests:
     *
     * 1. Multi-branch Structure:
     *    main
     *    ├── branch1
     *    │   └── branch1-sub
     *    └── branch2
     *        └── branch2-sub
     *
     * 2. Deep Nested Structure:
     *    level1
     *    └── level2
     *        └── level3
     *            └── level4
     *
     * 3. Moving Branch Structure:
     *    main1    main2
     *    └── branch
     *        └── subfolder
     *
     * Permission Inheritance Flow:
     * - Main folder permissions flow down to all children
     * - Branch permissions are added to inherited permissions
     * - Moving a branch updates all paths and permissions
     */

    describe("Folder Level Permissions -  UPDATE FLP - Complex", () => {
        const { handler } = useHandler();
        const type = "type";

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should handle multi-branch updates with different permissions", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            // Create main folder
            const mainFolderResult = await createFolder.execute({
                type,
                title: "Main",
                slug: "main",
                parentId: null
            });

            const mainFolder = mainFolderResult.value;

            // Create two branches under main
            const branch1Result = await createFolder.execute({
                type,
                title: "Branch 1",
                slug: "branch1",
                parentId: mainFolder.id
            });

            const branch1 = branch1Result.value;

            const branch2Result = await createFolder.execute({
                type,
                title: "Branch 2",
                slug: "branch2",
                parentId: mainFolder.id
            });

            const branch2 = branch2Result.value;

            // Create subfolders in each branch
            const branch1SubfolderResult = await createFolder.execute({
                type,
                title: "Branch 1 - Sub",
                slug: "branch1-sub",
                parentId: branch1.id
            });

            const branch1Subfolder = branch1SubfolderResult.value;

            const branch2SubfolderResult = await createFolder.execute({
                type,
                title: "Branch 2 - Sub",
                slug: "branch2-sub",
                parentId: branch2.id
            });

            const branch2Subfolder = branch2SubfolderResult.value;

            // Update main with permissions
            await updateFolder.execute(mainFolder.id, {
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer"
                    }
                ]
            });

            // Verify all folders have inherited main permissions
            // Verify main folder has its own permissions
            const mainFlp = await context.aco.flp.get(mainFolder.id);
            expect(mainFlp).toMatchObject({
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer"
                    }
                ]
            });

            // Verify branch1 inherited permissions from main
            const branch1Flp1 = await context.aco.flp.get(branch1.id);
            expect(branch1Flp1).toMatchObject({
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${mainFolder.id}`
                    }
                ]
            });

            // Verify branch2 inherited permissions from main
            const branch2Flp1 = await context.aco.flp.get(branch2.id);
            expect(branch2Flp1).toMatchObject({
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${mainFolder.id}`
                    }
                ]
            });

            // Verify branch1 subfolder inherited permissions from branch1
            const branch1SubFlp1 = await context.aco.flp.get(branch1Subfolder.id);
            expect(branch1SubFlp1).toMatchObject({
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${branch1.id}`
                    }
                ]
            });

            // Verify branch2 subfolder inherited permissions from branch2
            const branch2SubFlp1 = await context.aco.flp.get(branch2Subfolder.id);
            expect(branch2SubFlp1).toMatchObject({
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${branch2.id}`
                    }
                ]
            });

            // Update branch1 with its own permissions
            await updateFolder.execute(branch1.id, {
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor"
                    }
                ]
            });

            // Verify branch1 and its subfolder have both permissions
            const branch1Flp2 = await context.aco.flp.get(branch1.id);
            expect(branch1Flp2).toMatchObject({
                id: branch1.id,
                type,
                slug: branch1.slug,
                parentId: mainFolder.id,
                path: `${ROOT_FOLDER}/${mainFolder.slug}/${branch1.slug}`,
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor"
                    },
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${mainFolder.id}`
                    }
                ]
            });

            const branch1SubFlp2 = await context.aco.flp.get(branch1Subfolder.id);
            expect(branch1SubFlp2).toMatchObject({
                id: branch1Subfolder.id,
                type,
                slug: branch1Subfolder.slug,
                parentId: branch1.id,
                path: `${ROOT_FOLDER}/${mainFolder.slug}/${branch1.slug}/${branch1Subfolder.slug}`,
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor",
                        inheritedFrom: `parent:${branch1.id}`
                    },
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${branch1.id}`
                    }
                ]
            });

            // Verify branch2 and its subfolder still only have main permissions
            const branch2Flp2 = await context.aco.flp.get(branch2.id);
            expect(branch2Flp2).toMatchObject({
                id: branch2.id,
                type,
                slug: branch2.slug,
                parentId: mainFolder.id,
                path: `${ROOT_FOLDER}/${mainFolder.slug}/${branch2.slug}`,
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${mainFolder.id}`
                    }
                ]
            });

            const branch2SubFlp2 = await context.aco.flp.get(branch2Subfolder.id);
            expect(branch2SubFlp2).toMatchObject({
                id: branch2Subfolder.id,
                type,
                slug: branch2Subfolder.slug,
                parentId: branch2.id,
                path: `${ROOT_FOLDER}/${mainFolder.slug}/${branch2.slug}/${branch2Subfolder.slug}`,
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${branch2.id}`
                    }
                ]
            });
        });

        it("should handle deep nested folder updates", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            // Create a deep folder structure
            const level1Result = await createFolder.execute({
                type,
                title: "Level 1",
                slug: "level1",
                parentId: null
            });

            const level1 = level1Result.value;

            const level2Result = await createFolder.execute({
                type,
                title: "Level 2",
                slug: "level2",
                parentId: level1.id
            });

            const level2 = level2Result.value;

            const level3Result = await createFolder.execute({
                type,
                title: "Level 3",
                slug: "level3",
                parentId: level2.id
            });

            const level3 = level3Result.value;

            const level4Result = await createFolder.execute({
                type,
                title: "Level 4",
                slug: "level4",
                parentId: level3.id
            });

            const level4 = level4Result.value;

            const folders = [level1, level2, level3, level4];

            // Update level1 with permissions
            await updateFolder.execute(level1.id, {
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer"
                    }
                ]
            });

            // Verify all levels have inherited permissions
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                const flp = await context.aco.flp.get(folder.id);

                const expectedPath = folders
                    .slice(0, i + 1)
                    .map(f => f.slug)
                    .join("/");

                if (i === 0) {
                    expect(flp).toMatchObject({
                        id: folder.id,
                        type,
                        slug: folder.slug,
                        parentId: ROOT_FOLDER,
                        path: `${ROOT_FOLDER}/${expectedPath}`,
                        permissions: [
                            {
                                target: "admin:user1",
                                level: "viewer"
                            }
                        ]
                    });
                } else {
                    expect(flp).toMatchObject({
                        id: folder.id,
                        type,
                        slug: folder.slug,
                        parentId: folders[i - 1].id,
                        path: `${ROOT_FOLDER}/${expectedPath}`,
                        permissions: [
                            {
                                target: "admin:user1",
                                level: "viewer",
                                inheritedFrom: `parent:${folders[i - 1].id}`
                            }
                        ]
                    });
                }
            }

            // Update level2 with its empty permissions: it should always inherit permissions from level1 and propagate them down
            await updateFolder.execute(level2.id, {
                permissions: []
            });

            // Verify level2 has no permissions
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                const flp = await context.aco.flp.get(folder.id);

                const expectedPath = folders
                    .slice(0, i + 1)
                    .map(f => f.slug)
                    .join("/");

                if (i === 0) {
                    expect(flp).toMatchObject({
                        id: folder.id,
                        type,
                        slug: folder.slug,
                        parentId: ROOT_FOLDER,
                        path: `${ROOT_FOLDER}/${expectedPath}`,
                        permissions: [
                            {
                                target: "admin:user1",
                                level: "viewer"
                            }
                        ]
                    });
                } else {
                    expect(flp).toMatchObject({
                        id: folder.id,
                        type,
                        slug: folder.slug,
                        parentId: folders[i - 1].id,
                        path: `${ROOT_FOLDER}/${expectedPath}`,
                        permissions: [
                            {
                                target: "admin:user1",
                                level: "viewer",
                                inheritedFrom: `parent:${folders[i - 1].id}`
                            }
                        ]
                    });
                }
            }

            // Update level3 with its own permissions
            await updateFolder.execute(level3.id, {
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor"
                    }
                ]
            });

            // Verify level3 and level4 have both permissions
            const level3Flp = await context.aco.flp.get(level3.id);

            expect(level3Flp).toMatchObject({
                id: level3.id,
                type,
                slug: level3.slug,
                parentId: level2.id,
                path: `${ROOT_FOLDER}/${level1.slug}/${level2.slug}/${level3.slug}`,
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor"
                    },
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${level2.id}`
                    }
                ]
            });

            const level4Flp = await context.aco.flp.get(level4.id);
            expect(level4Flp).toMatchObject({
                id: level4.id,
                type,
                slug: level4.slug,
                parentId: level3.id,
                path: `${ROOT_FOLDER}/${level1.slug}/${level2.slug}/${level3.slug}/${level4.slug}`,
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor",
                        inheritedFrom: `parent:${level3.id}`
                    },
                    {
                        target: "admin:user1",
                        level: "viewer",
                        inheritedFrom: `parent:${level3.id}`
                    }
                ]
            });
        });

        it("should handle moving a branch to a different parent", async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);

            // Create two main folders
            const main1Result = await createFolder.execute({
                type,
                title: "Main 1",
                slug: "main1",
                parentId: null
            });

            const main1 = main1Result.value;

            await updateFolder.execute(main1.id, {
                permissions: [
                    {
                        target: "admin:user1",
                        level: "viewer"
                    }
                ]
            });

            const main2Result = await createFolder.execute({
                type,
                title: "Main 2",
                slug: "main2",
                parentId: null
            });

            const main2 = main2Result.value;

            await updateFolder.execute(main2.id, {
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor"
                    }
                ]
            });

            // Create a branch under main1
            const branchResult = await createFolder.execute({
                type,
                title: "Branch",
                slug: "branch",
                parentId: main1.id
            });

            const branch = branchResult.value;

            // Create a subfolder in the branch
            const subfolderResult = await createFolder.execute({
                type,
                title: "Subfolder",
                slug: "subfolder",
                parentId: branch.id
            });

            const subfolder = subfolderResult.value;

            // Move the branch to main2
            await updateFolder.execute(branch.id, {
                parentId: main2.id
            });

            // Verify branch and subfolder have correct paths and permissions
            const branchFlp = await context.aco.flp.get(branch.id);
            expect(branchFlp).toMatchObject({
                id: branch.id,
                type,
                slug: branch.slug,
                parentId: main2.id,
                path: `${ROOT_FOLDER}/${main2.slug}/${branch.slug}`,
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor",
                        inheritedFrom: `parent:${main2.id}`
                    }
                ]
            });

            const subfolderFlp = await context.aco.flp.get(subfolder.id);
            expect(subfolderFlp).toMatchObject({
                id: subfolder.id,
                type,
                slug: subfolder.slug,
                parentId: branch.id,
                path: `${ROOT_FOLDER}/${main2.slug}/${branch.slug}/${subfolder.slug}`,
                permissions: [
                    {
                        target: "admin:user2",
                        level: "editor",
                        inheritedFrom: `parent:${branch.id}`
                    }
                ]
            });
        });
    });
});
