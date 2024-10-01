import models from "./mocks/contentModels";
import { CmsEntry, CmsGroup, CmsModel } from "~/types";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { createMockCmsEntry } from "~tests/helpers/createMockCmsEntry";

const manageOpts = {
    path: "manage/en-US"
};

const createMetaData = () => {
    return {
        testBoolean: true,
        testString: "yes",
        testNumber: 321,
        testArray: ["item", "true", "54321"],
        testArrayObjects: [
            {
                obj1: "1",
                obj2: "2"
            },
            {
                obj3: "3",
                obj4: "4"
            },
            {
                obj5: "false",
                obj6: "true"
            }
        ],
        testObject: {
            key: "value object"
        }
    };
};

describe("Content Entry Meta Field", () => {
    const {
        listCategories,
        getCategory,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation,
        storageOperations
    } = useCategoryManageHandler(manageOpts);

    const setup = async () => {
        const [createDefaultGroupResponse] = await createContentModelGroupMutation({
            data: {
                name: "Default group",
                slug: "default-group",
                icon: "ico/ico",
                description: "description"
            }
        });
        const group: CmsGroup = createDefaultGroupResponse.data.createContentModelGroup.data;

        const targetModel = models.find(m => m.modelId === "category");
        if (!targetModel) {
            throw new Error("Could not find model `category`.");
        }
        const [createModelResponse] = await createContentModelMutation({
            data: {
                name: targetModel.name,
                modelId: targetModel.modelId,
                singularApiName: targetModel.singularApiName,
                pluralApiName: targetModel.pluralApiName,
                group: group.id
            }
        });

        const [updateModelResponse] = await updateContentModelMutation({
            modelId: createModelResponse.data.createContentModel.data.modelId,
            data: {
                fields: targetModel.fields,
                layout: targetModel.layout
            }
        });
        const model: CmsModel = {
            ...updateModelResponse.data.updateContentModel.data,
            tenant: "root",
            locale: "en-US"
        };

        return {
            model,
            group
        };
    };

    it("storage operations - should have meta field data in the retrieved record", async () => {
        const { model } = await setup();
        const entryId = generateAlphaNumericLowerCaseId(8);
        const entry = createMockCmsEntry({
            id: `${entryId}#0001`,
            entryId,
            version: 1,
            createdBy: {
                id: "admin",
                type: "admin",
                displayName: "admin"
            },
            savedBy: {
                id: "admin",
                type: "admin",
                displayName: "admin"
            },
            modelId: model.modelId,
            locale: model.locale,
            tenant: model.tenant,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            locked: false,
            values: {
                title: "test category",
                slug: "test-category"
            },
            status: "draft",
            webinyVersion: "5.27.0",
            meta: createMetaData()
        });

        const createdRecord = await storageOperations.entries.create(model, {
            entry,
            storageEntry: entry
        });

        expect(createdRecord).toEqual({
            ...entry
        });

        const recordToPublish: CmsEntry = {
            ...createdRecord,
            status: "published",
            locked: true
        };

        const publishedRecord = await storageOperations.entries.publish(model, {
            entry: recordToPublish,
            storageEntry: recordToPublish
        });

        expect(publishedRecord).toEqual({
            ...publishedRecord
        });

        /**
         * Meta field data should be available when getting and listing directly from the storage.
         */
        const getRecordResult = await storageOperations.entries.get(model, {
            where: {
                id: createdRecord.id,
                latest: true
            }
        });

        expect(getRecordResult).toMatchObject({
            ...entry,
            locked: true,
            status: "published",
            meta: createMetaData()
        });

        const listLatestRecordResult = await storageOperations.entries.list(model, {
            where: {
                latest: true
            },
            limit: 10000
        });

        expect(listLatestRecordResult).toEqual({
            hasMoreItems: false,
            items: [
                {
                    ...entry,
                    locked: true,
                    status: "published",
                    meta: createMetaData()
                }
            ],
            cursor: expect.any(String),
            totalCount: 1
        });

        const [getCategoryResponse] = await getCategory({
            revision: entry.id
        });

        expect(getCategoryResponse).toMatchObject({
            data: {
                getCategory: {
                    data: {
                        id: entry.id,
                        entryId: entry.entryId,
                        meta: {
                            data: createMetaData()
                        }
                    },
                    error: null
                }
            }
        });

        const [listCategoriesResponse] = await listCategories({});

        expect(listCategoriesResponse).toMatchObject({
            data: {
                listCategories: {
                    data: [
                        {
                            id: entry.id,
                            entryId: entry.entryId,
                            meta: {
                                data: createMetaData()
                            }
                        }
                    ],
                    error: null,
                    meta: {
                        cursor: null,
                        totalCount: 1,
                        hasMoreItems: false
                    }
                }
            }
        });
    });
});
