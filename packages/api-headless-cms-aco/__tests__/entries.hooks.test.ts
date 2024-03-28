import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { assignCmsLifecycleEvents, tracker } from "./mocks/lifecycle.mock";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants";

describe("HCMS Entries -> onEntryBeforeRestore", () => {
    beforeEach(async () => {
        tracker.reset();
    });

    it("should have HCMS and ACO GraphQL Query and Mutation", async () => {
        const { introspect } = useGraphQlHandler({});
        const [result] = await introspect();
        expect(result).not.toBeNull();
    });

    it(`should not change the location if folderId is ${ROOT_FOLDER}`, async () => {
        const { cms } = useGraphQlHandler({
            plugins: [assignCmsLifecycleEvents()]
        });

        // Let's create the model group and model
        const modelGroup = await cms.createTestModelGroup();
        const model = await cms.createBasicModel({ modelGroup: modelGroup.id });

        // Let's create the entry
        const [createEntryResponse] = await cms.createEntry(model, {
            data: { title: "Entry 1" }
        });

        const entry = createEntryResponse.data[`create${model.singularApiName}`]?.data;

        // Let's move the entry to the trash bin
        await cms.deleteEntry(model, {
            revision: entry.entryId,
            options: {
                permanently: false
            }
        });

        // Let's restore the entry from the trash bin
        const [restoreEntryResponse] = await cms.restoreEntry(model, {
            revision: entry.entryId
        });

        expect(restoreEntryResponse).toMatchObject({
            data: {
                [`restore${model.singularApiName}`]: {
                    data: entry
                }
            }
        });

        // Let's get back the entry
        const [getEntryResponse] = await cms.getEntry(model, {
            revision: entry.id
        });

        expect(getEntryResponse).toMatchObject({
            data: {
                [`get${model.singularApiName}`]: {
                    data: entry
                }
            }
        });
    });

    it(`should not change the location if folder exists`, async () => {
        const { cms, aco } = useGraphQlHandler({
            plugins: [assignCmsLifecycleEvents()]
        });

        // Let's create the model group and model
        const modelGroup = await cms.createTestModelGroup();
        const model = await cms.createBasicModel({ modelGroup: modelGroup.id });

        // Let's create the folder
        const [createFolderResponse] = await aco.createFolder({
            data: {
                title: "Folder 1",
                slug: "folder-1",
                type: `cms:${model.modelId}`
            }
        });

        const folder = createFolderResponse.data?.aco?.createFolder?.data;

        // Let's create the entry inside the folder we have just created
        const [createEntryResponse] = await cms.createEntry(model, {
            data: {
                title: "Entry 1",
                wbyAco_location: {
                    folderId: folder.id
                }
            }
        });

        const entry = createEntryResponse.data[`create${model.singularApiName}`]?.data;

        // Let's move the entry to the trash bin
        await cms.deleteEntry(model, {
            revision: entry.entryId,
            options: {
                permanently: false
            }
        });

        // Let's restore the entry from the trash bin
        const [restoreEntryResponse] = await cms.restoreEntry(model, {
            revision: entry.entryId
        });

        expect(restoreEntryResponse).toMatchObject({
            data: {
                [`restore${model.singularApiName}`]: {
                    data: entry
                }
            }
        });

        // Let's get back the entry
        const [getEntryResponse] = await cms.getEntry(model, {
            revision: entry.id
        });

        expect(getEntryResponse).toMatchObject({
            data: {
                [`get${model.singularApiName}`]: {
                    data: entry
                }
            }
        });
    });

    it(`should change the location to ${ROOT_FOLDER} if the folder does not exist`, async () => {
        const { cms, aco } = useGraphQlHandler({
            plugins: [assignCmsLifecycleEvents()]
        });

        // Let's create the model group and model
        const modelGroup = await cms.createTestModelGroup();
        const model = await cms.createBasicModel({ modelGroup: modelGroup.id });

        // Let's create the folder
        const [createFolderResponse] = await aco.createFolder({
            data: {
                title: "Folder 1",
                slug: "folder-1",
                type: `cms:${model.modelId}`
            }
        });

        const folder = createFolderResponse.data?.aco?.createFolder?.data;

        // Let's create the entry inside the folder we have just created
        const [createEntryResponse] = await cms.createEntry(model, {
            data: {
                title: "Entry 1",
                wbyAco_location: {
                    folderId: folder.id
                }
            }
        });

        const entry = createEntryResponse.data[`create${model.singularApiName}`]?.data;

        // Let's move the entry to the trash bin
        await cms.deleteEntry(model, {
            revision: entry.entryId,
            options: {
                permanently: false
            }
        });

        // Let's delete the folder
        await aco.deleteFolder({
            id: folder.id
        });

        // Let's restore the entry from the trash bin
        const [restoreEntryResponse] = await cms.restoreEntry(model, {
            revision: entry.entryId
        });

        expect(restoreEntryResponse).toMatchObject({
            data: {
                [`restore${model.singularApiName}`]: {
                    data: {
                        ...entry,
                        wbyAco_location: {
                            folderId: ROOT_FOLDER
                        }
                    }
                }
            }
        });

        // Let's get back the entry
        const [getEntryResponse] = await cms.getEntry(model, {
            revision: entry.id
        });

        expect(getEntryResponse).toMatchObject({
            data: {
                [`get${model.singularApiName}`]: {
                    data: {
                        ...entry,
                        wbyAco_location: {
                            folderId: ROOT_FOLDER
                        }
                    }
                }
            }
        });
    });
});
