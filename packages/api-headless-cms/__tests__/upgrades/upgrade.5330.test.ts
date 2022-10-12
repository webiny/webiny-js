import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import models from "../contentAPI/mocks/contentModels";
import { CmsContext, CmsModel, CmsModelField } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { Tenant } from "@webiny/api-tenancy/types";

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
const locales: string[] = ["en-US", "de-DE"];
const tenants: string[] = ["root", "webiny", "admin"];
const createTestTenantsContextPlugin = () => {
    return new ContextPlugin<CmsContext>(async context => {
        for (const tenant of tenants) {
            const tenantObj: Tenant = {
                id: tenant,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                name: `${tenant} name`,
                settings: {
                    domains: []
                },
                description: `${tenant} description`,
                status: "active",
                parent: null
            };
            await context.tenancy.getStorageOperations().createTenant(tenantObj);

            for (const locale of locales) {
                await context.i18n.locales.storageOperations.create({
                    locale: {
                        code: locale,
                        default: true,
                        createdOn: new Date().toISOString(),
                        createdBy: {
                            id: "admin",
                            displayName: "admin",
                            type: "admin"
                        },
                        tenant,
                        webinyVersion: context.WEBINY_VERSION
                    }
                });
            }
        }
    });
};

const extractFieldsFromModels = (models: CmsModel[]): CmsModelField[] => {
    const getFields = (input?: CmsModelField[]): CmsModelField[] => {
        if (!input) {
            return [];
        }
        return input.reduce<CmsModelField[]>((fields, field) => {
            if (field.settings?.fields) {
                fields.push(...getFields(field.settings.fields));
            }
            fields.push(field);
            return fields;
        }, []);
    };

    return models.reduce<CmsModelField[]>((fields, model) => {
        fields.push(...getFields(model.fields));

        return fields;
    }, []);
};

describe("upgrade for 5.33.0", () => {
    const { listContentModelsQuery } = useGraphQLHandler({
        path: "manage/en-US"
    });

    beforeEach(() => {
        process.env.WEBINY_VERSION = "5.33.0";
    });

    const { storageOperations, upgradeMutation } = useGraphQLHandler({
        plugins: [createTestTenantsContextPlugin()]
    });

    const insertModels = async (tenant: string) => {
        const clearedModelsToInsert = models.map(model => {
            return {
                ...model,
                tenant,
                fields: clearStorageId(model.fields),
                createdBy: {
                    id: "adminId",
                    type: "admin",
                    displayName: "Admin"
                }
            };
        });

        const modelsToInsert = clearedModelsToInsert.concat(
            clearedModelsToInsert.map(model => {
                return {
                    ...model,
                    locale: "de-DE"
                };
            })
        );
        /**
         * These are the models, sorted by name, which we are getting back from the GraphQL API.
         */
        const sortedModels: CmsModel[] = clearedModelsToInsert.sort((a, b) => {
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
                throw new Error(ex.message);
            }
        }

        return {
            sortedModels
        };
    };

    it("should add storageId to all the models", async () => {
        const { sortedModels: sortedRootModel } = await insertModels("root");
        await insertModels("webiny");
        await insertModels("admin");
        /**
         * Each of the tenants must have 2x sortedModels
         */
        for (const tenant of tenants) {
            let total = 0;
            for (const locale of locales) {
                const listModelResponse = await storageOperations.models.list({
                    where: {
                        tenant,
                        locale
                    }
                });
                total = total + listModelResponse.length;
            }
            expect(total).toEqual(sortedRootModel.length * 2);
        }

        const fields: CmsModelField[] = [];

        /**
         * First we need to test that everything is fine before the upgrade.
         */
        for (const tenant of tenants) {
            /**
             * In the list of models from query we expect it to have the storageId
             * as we attach on in listing in the crud
             */
            const [listContentModelsBeforeUpgradeResult] = await listContentModelsQuery();

            const expectedModelsBeforeUpgradeViaQuery = sortedRootModel.map(model => {
                return {
                    modelId: model.modelId,
                    fields: expectModelFieldsAfterUpgrade(model.fields)
                };
            });
            expect(listContentModelsBeforeUpgradeResult).toMatchObject({
                data: {
                    listContentModels: {
                        data: expectedModelsBeforeUpgradeViaQuery,
                        error: null
                    }
                }
            });

            /**
             * In the list of models from storage operations listing we expect models not to have storageId.
             */
            const expectedModelsBeforeUpgrade = sortedRootModel.map(model => {
                return {
                    modelId: model.modelId,
                    fields: expectModelFieldsBeforeUpgrade(model.fields)
                };
            });

            const listEnModelsResponse = await storageOperations.models.list({
                where: {
                    tenant,
                    locale: "en-US"
                }
            });

            expect(listEnModelsResponse).toMatchObject(expectedModelsBeforeUpgrade);

            const listDeModelsResponse = await storageOperations.models.list({
                where: {
                    tenant,
                    locale: "de-DE"
                }
            });

            expect(listDeModelsResponse).toMatchObject(
                expectedModelsBeforeUpgrade.map(model => {
                    return {
                        ...model,
                        tenant,
                        locale: "de-DE"
                    };
                })
            );
        }

        /**
         * Then we do the upgrade...
         */
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
        /**
         * Then we go and test everything again, after the upgrade...
         */
        for (const tenant of tenants) {
            const expectedModelsAfterUpgrade = sortedRootModel.map(model => {
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
            /**
             * We need to check models we get via the storage operations.
             */
            const listEnModelsViaStorageOperationsResponse = await storageOperations.models.list({
                where: {
                    tenant,
                    locale: "en-US"
                }
            });

            expect(listEnModelsViaStorageOperationsResponse).toMatchObject(
                expectedModelsAfterUpgrade
            );
            /**
             * Also, if we go to fetch the models in de-DE locale via storage operations, they should also have their fields updated.
             */
            const listDeModelsViaStorageOperationsResponse = await storageOperations.models.list({
                where: {
                    tenant,
                    locale: "de-DE"
                }
            });

            expect(listDeModelsViaStorageOperationsResponse).toMatchObject(
                expectedModelsAfterUpgrade.map(model => {
                    return {
                        ...model,
                        locale: "de-DE"
                    };
                })
            );
            /**
             * We will have one last test for the field definitions, but we need all the fields for that.
             */
            fields.push(
                ...extractFieldsFromModels(
                    listContentModelsAfterUpgradeResult.data.listContentModels.data
                )
            );
            fields.push(...extractFieldsFromModels(listEnModelsViaStorageOperationsResponse));
            fields.push(...extractFieldsFromModels(listDeModelsViaStorageOperationsResponse));
        }
        /**
         * All collected fields MUST have storageId properly defined.
         */
        for (const field of fields) {
            expect(field.storageId).toBeDefined();
            expect(field.storageId).toMatch(/^([a-zA-Z]+)$/);
            expect(field.storageId.length).toBeGreaterThan(2);
            expect(field.storageId).toEqual(field.fieldId);
        }
    });
});
