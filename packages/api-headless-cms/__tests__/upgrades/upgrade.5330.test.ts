import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import models from "../contentAPI/mocks/contentModels";
import { CmsModelField } from "~/types";

const clearStorageId = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        const settings = {
            ...(field.settings || {})
        };
        if (settings.fields && Array.isArray(settings.fields) === true) {
            settings.fields = clearStorageId(settings.fields);
        }
        const result: CmsModelField = {
            ...field,
            storageId: null as any,
            settings
        };
        return result;
    });
};

const expectModelFieldsBeforeUpgrade = (fields: CmsModelField[]): Partial<CmsModelField>[] => {
    return fields.map(field => {
        const result: Partial<CmsModelField> = {
            id: field.id,
            fieldId: field.fieldId,
            storageId: null as any
        };
        if (field.settings?.fields) {
            const settings: any = {
                ...(field.settings || {})
            };
            if (settings.fields && Array.isArray(settings.fields) === true) {
                settings.fields = expectModelFieldsBeforeUpgrade(settings.fields);
            }
            result.settings = {
                ...settings
            };
        }
        return result;
    });
};

const expectModelFieldsAfterUpgrade = (fields: CmsModelField[]): Partial<CmsModelField>[] => {
    return fields.map(field => {
        const result: Partial<CmsModelField> = {
            id: field.id,
            fieldId: field.fieldId,
            storageId: field.fieldId
        };
        if (field.settings?.fields) {
            const settings: any = {
                ...(field.settings || {})
            };
            if (settings.fields && Array.isArray(settings.fields) === true) {
                settings.fields = expectModelFieldsAfterUpgrade(settings.fields);
            }
            result.settings = {
                ...settings
            };
        }
        return result;
    });
};

describe("upgrade for 5.33.0", () => {
    const { listContentModelsQuery } = useGraphQLHandler({
        path: "manage/en-US"
    });

    beforeEach(() => {
        process.env.WEBINY_VERSION = "5.33.0";
    });

    const { storageOperations, upgradeMutation } = useGraphQLHandler({});

    it("should add storageId to all the models", async () => {
        const modelsToInsert = models.map(model => {
            return {
                ...model,
                fields: clearStorageId(model.fields),
                createdBy: {
                    id: "adminId",
                    type: "admin",
                    displayName: "Admin"
                }
            };
        });
        /**
         * These are the models, sorted by name, which we are getting back from the GraphQL API.
         */
        const sortedModels = models.sort((a, b) => {
            if (a.modelId < b.modelId) {
                return -1;
            } else if (a.modelId > b.modelId) {
                return 1;
            }
            return 0;
        });

        for (const model of modelsToInsert) {
            try {
                await storageOperations.models.create({
                    model
                });
            } catch (ex) {
                console.log(ex.message);
                return;
            }
        }

        const [listContentModelsBeforeUpgradeResult] = await listContentModelsQuery();

        const expectedModelsBeforeUpgrade = sortedModels.map(model => {
            return {
                modelId: model.modelId,
                fields: expectModelFieldsBeforeUpgrade(model.fields)
            };
        });
        expect(listContentModelsBeforeUpgradeResult).toMatchObject({
            data: {
                listContentModels: {
                    data: expectedModelsBeforeUpgrade,
                    error: null
                }
            }
        });

        const [upgradeResponse] = await upgradeMutation("5.33.0");

        expect(upgradeResponse).toMatchObject({
            data: {
                cms: {
                    upgrade: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const expectedModelsAfterUpgrade = sortedModels.map(model => {
            return {
                modelId: model.modelId,
                fields: expectModelFieldsAfterUpgrade(model.fields)
            };
        });

        const [listContentModelsAfterUpgradeResult] = await listContentModelsQuery();

        expect(listContentModelsAfterUpgradeResult).toMatchObject({
            data: {
                listContentModels: {
                    data: expectedModelsAfterUpgrade,
                    error: null
                }
            }
        });
    });
});
