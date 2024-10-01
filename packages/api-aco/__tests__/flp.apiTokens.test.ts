import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const identityA: SecurityIdentity = { id: "1", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "2", type: "admin", displayName: "B" };
const identityApiToken: SecurityIdentity = { id: "3", type: "api-token", displayName: "API Token" };

describe("Folder Level Permissions - API Tokens", () => {
    it("FLPs should not interfere with API tokens", async () => {
        const gqlIdentityA = useGraphQlHandler({ identity: identityA });

        const gqlIdentityApiToken = useGraphQlHandler({
            identity: identityApiToken,
            permissions: [{ name: "cms.*" }]
        });

        const modelGroup = await gqlIdentityA.cms.createTestModelGroup();
        const model = await gqlIdentityA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folder = await gqlIdentityA.aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: `cms:${model.modelId}`
                }
            })
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

        const createdEntry = await gqlIdentityA.cms
            .createEntry(model, {
                data: {
                    title: `Test entry`,
                    wbyAco_location: {
                        folderId: folder.id
                    }
                }
            })
            .then(([response]) => {
                return response.data.createBasicTestModel.data;
            });

        // Set identity B as viewer of the folder. We need this just so FLP kicks in.
        // Otherwise, anybody can access content in the folder, no FLPs are applied.
        // In any case, this should not affect the API key.
        await gqlIdentityA.aco.updateFolder({
            id: folder.id,
            data: {
                permissions: [
                    {
                        target: `admin:${identityB.id}`,
                        level: "viewer"
                    }
                ]
            }
        });

        // Getting content in the folder should be allowed for API key.
        await expect(
            gqlIdentityApiToken.cms
                .getEntry(model, { revision: createdEntry.id })
                .then(([response]) => {
                    return response.data.getBasicTestModel;
                })
        ).resolves.toMatchObject({
            data: { id: createdEntry.id },
            error: null
        });

        // Listing content in the folder should be allowed for API key.
        await expect(
            gqlIdentityApiToken.cms
                .listEntries(model, {
                    where: {
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.listBasicTestModels;
                })
        ).resolves.toMatchObject({
            data: [{ id: createdEntry.id }],
            error: null,
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 1
            }
        });

        // Creating content in the folder should be allowed with an API key.
        await expect(
            gqlIdentityApiToken.cms
                .createEntry(model, {
                    data: {
                        title: `Test-5`,
                        wbyAco_location: {
                            folderId: folder.id
                        }
                    }
                })
                .then(([response]) => {
                    return response.data.createBasicTestModel;
                })
        ).resolves.toMatchObject({
            data: { id: expect.any(String) }
        });

        // Updating content in the folder should be allowed with an API key.
        await expect(
            gqlIdentityApiToken.cms
                .updateEntry(model, {
                    revision: createdEntry.id,
                    data: { title: createdEntry.title + "-update" }
                })
                .then(([response]) => {
                    return response.data.updateBasicTestModel;
                })
        ).resolves.toMatchObject({
            data: { title: createdEntry.title + "-update" }
        });

        // Deleting content in the folder should be allowed with an API key.
        await expect(
            gqlIdentityApiToken.cms
                .deleteEntry(model, { revision: createdEntry.entryId })
                .then(([response]) => {
                    return response.data.deleteBasicTestModel;
                })
        ).resolves.toMatchObject({ data: true, error: null });
    });
});
