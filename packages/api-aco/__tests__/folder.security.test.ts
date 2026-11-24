import { describe, expect, test } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";

const FOLDER_TYPE = "test-folders";
const OTHER_FOLDER_TYPE = "other-test-folders";

const identityA: IdentityData = { id: "1", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "2", type: "admin", displayName: "B" };

const GET_FOLDER_HIERARCHY = /* GraphQL */ `
    query GetFolderHierarchy($type: String!, $id: ID!) {
        aco {
            getFolderHierarchy(type: $type, id: $id) {
                data {
                    parents {
                        id
                    }
                    siblings {
                        id
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

describe("Folders - security checks", () => {
    const gqlA = useGraphQlHandler({ identity: identityA });

    const createFolder = async (
        gql: ReturnType<typeof useGraphQlHandler>,
        data: Record<string, any>
    ) => {
        const [response] = await gql.aco.createFolder({ data });
        return response.data.aco.createFolder;
    };

    const updateFolder = async (
        gql: ReturnType<typeof useGraphQlHandler>,
        id: string,
        data: Record<string, any>
    ) => {
        const [response] = await gql.aco.updateFolder({ id, data });
        return response.data.aco.updateFolder;
    };

    test("getFolderHierarchy does not return a folder of another type", async () => {
        const { data: otherFolder } = await createFolder(gqlA, {
            title: "Other",
            slug: "other",
            type: OTHER_FOLDER_TYPE
        });

        const [mismatched] = await gqlA.invoke({
            body: {
                query: GET_FOLDER_HIERARCHY,
                variables: { type: FOLDER_TYPE, id: otherFolder.id }
            }
        });
        expect(mismatched.data.aco.getFolderHierarchy).toMatchObject({
            data: null,
            error: { code: "Aco/Folder/NotFound" }
        });

        const [matching] = await gqlA.invoke({
            body: {
                query: GET_FOLDER_HIERARCHY,
                variables: { type: OTHER_FOLDER_TYPE, id: otherFolder.id }
            }
        });
        expect(matching.data.aco.getFolderHierarchy).toMatchObject({
            data: { parents: [{ id: otherFolder.id }] },
            error: null
        });
    });

    test("updateFolder ignores `type` and `path` from the input", async () => {
        const { data: folder } = await createFolder(gqlA, {
            title: "Folder",
            slug: "folder",
            type: FOLDER_TYPE
        });

        const result = await updateFolder(gqlA, folder.id, {
            title: "Folder - updated",
            type: OTHER_FOLDER_TYPE,
            path: "evil/path"
        });

        expect(result).toMatchObject({
            data: {
                id: folder.id,
                title: "Folder - updated",
                type: FOLDER_TYPE,
                path: folder.path
            },
            error: null
        });
    });

    test("a folder cannot be created or moved under a parent of another type", async () => {
        const { data: otherParent } = await createFolder(gqlA, {
            title: "Other parent",
            slug: "other-parent",
            type: OTHER_FOLDER_TYPE
        });

        await expect(
            createFolder(gqlA, {
                title: "Child",
                slug: "child",
                type: FOLDER_TYPE,
                parentId: otherParent.id
            })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });

        const { data: folder } = await createFolder(gqlA, {
            title: "Folder",
            slug: "folder",
            type: FOLDER_TYPE
        });

        await expect(
            updateFolder(gqlA, folder.id, { parentId: otherParent.id })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });
    });

    test("a folder cannot become its own parent or move into its own subtree", async () => {
        const { data: folderA } = await createFolder(gqlA, {
            title: "A",
            slug: "a",
            type: FOLDER_TYPE
        });
        const { data: folderB } = await createFolder(gqlA, {
            title: "B",
            slug: "b",
            type: FOLDER_TYPE,
            parentId: folderA.id
        });
        const { data: folderC } = await createFolder(gqlA, {
            title: "C",
            slug: "c",
            type: FOLDER_TYPE,
            parentId: folderB.id
        });

        await expect(
            updateFolder(gqlA, folderA.id, { parentId: folderA.id })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });

        await expect(
            updateFolder(gqlA, folderA.id, { parentId: folderC.id })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });

        // Moving a leaf to another branch still works.
        const { data: folderD } = await createFolder(gqlA, {
            title: "D",
            slug: "d",
            type: FOLDER_TYPE
        });
        await expect(
            updateFolder(gqlA, folderC.id, { parentId: folderD.id })
        ).resolves.toMatchObject({
            data: { id: folderC.id, parentId: folderD.id },
            error: null
        });
    });

    test("createFolder validates permissions and requires the owner level on the parent to set them", async () => {
        const gqlB = useGraphQlHandler({ identity: identityB, permissions: [] });

        const { data: parent } = await createFolder(gqlA, {
            title: "Parent",
            slug: "parent",
            type: FOLDER_TYPE
        });

        await updateFolder(gqlA, parent.id, {
            permissions: [{ target: `admin:${identityB.id}`, level: "editor" }]
        });

        // An editor on the parent cannot create a subfolder with its own permissions.
        await expect(
            createFolder(gqlB, {
                title: "Child",
                slug: "child",
                type: FOLDER_TYPE,
                parentId: parent.id,
                permissions: [{ target: `admin:${identityA.id}`, level: "no-access" }]
            })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });

        // Without own permissions, an editor can still create a subfolder.
        await expect(
            createFolder(gqlB, {
                title: "Child",
                slug: "child",
                type: FOLDER_TYPE,
                parentId: parent.id
            })
        ).resolves.toMatchObject({
            data: { parentId: parent.id },
            error: null
        });

        // Invalid targets and manual `inheritedFrom` are rejected.
        await expect(
            createFolder(gqlA, {
                title: "Invalid target",
                slug: "invalid-target",
                type: FOLDER_TYPE,
                permissions: [{ target: "role:something", level: "owner" }]
            })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });

        await expect(
            createFolder(gqlA, {
                title: "Inherited",
                slug: "inherited",
                type: FOLDER_TYPE,
                permissions: [
                    {
                        target: `admin:${identityB.id}`,
                        level: "owner",
                        inheritedFrom: "parent:x"
                    }
                ]
            })
        ).resolves.toMatchObject({
            data: null,
            error: { code: "Aco/Folder/ValidationError" }
        });

        // A root folder inherits nothing, so its creator may set its permissions.
        await expect(
            createFolder(gqlB, {
                title: "Root of B",
                slug: "root-of-b",
                type: FOLDER_TYPE,
                permissions: [{ target: `admin:${identityB.id}`, level: "owner" }]
            })
        ).resolves.toMatchObject({
            data: { parentId: null },
            error: null
        });
    });

    test("a folder with content the identity cannot see is not deleted, even without FLP", async () => {
        const testProjectLicense = createTestWcpLicense({ folderLevelPermissions: false });
        const gqlOwner = useGraphQlHandler({ identity: identityA, testProjectLicense });
        const gqlOwnOnly = useGraphQlHandler({
            identity: identityB,
            testProjectLicense,
            permissions: [
                { name: "cms.endpoint.manage" },
                { name: "cms.contentModelGroup", rwd: "r" },
                { name: "cms.contentModel", rwd: "r" },
                { name: "cms.contentEntry", rwd: "rwd", own: true }
            ]
        });

        const modelGroup = await gqlOwner.cms.createTestModelGroup();
        const model = await gqlOwner.cms.createBasicModel({ modelGroup: modelGroup.id });

        const { data: folder } = await createFolder(gqlOwner, {
            title: "Shared",
            slug: "shared",
            type: `cms:${model.modelId}`
        });

        await gqlOwner.cms.createEntry(model, {
            data: {
                values: { title: "Owned by A" },
                wbyAco_location: { folderId: folder.id }
            }
        });

        const [deleteResponse] = await gqlOwnOnly.aco.deleteFolder({ id: folder.id });
        expect(deleteResponse.data.aco.deleteFolder.data).toBeFalsy();
        expect(deleteResponse.data.aco.deleteFolder.error).toBeTruthy();

        // The folder still exists.
        await expect(
            gqlOwner.aco.getFolder({ id: folder.id }).then(([response]) => {
                return response.data.aco.getFolder;
            })
        ).resolves.toMatchObject({
            data: { id: folder.id },
            error: null
        });
    });
});
