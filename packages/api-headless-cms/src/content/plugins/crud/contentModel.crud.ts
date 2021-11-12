import {
    CmsContext,
    CmsContentModel,
    CmsContentModelContext,
    CmsContentModelManager,
    CmsContentModelPermission,
    HeadlessCmsStorageOperations,
    BeforeModelCreateTopicParams,
    AfterModelCreateTopicParams,
    BeforeModelUpdateTopicParams,
    AfterModelUpdateTopicParams,
    BeforeModelDeleteTopicParams,
    AfterModelDeleteTopicParams
} from "~/types";
import * as utils from "~/utils";
import DataLoader from "dataloader";
import { NotFoundError } from "@webiny/handler-graphql";
import { contentModelManagerFactory } from "./contentModel/contentModelManagerFactory";
import { CreateContentModelModel, UpdateContentModelModel } from "./contentModel/models";
import { createFieldModels } from "./contentModel/createFieldModels";
import { validateLayout } from "./contentModel/validateLayout";
import { NotAuthorizedError } from "@webiny/api-security";
import WebinyError from "@webiny/error";
import { ContentModelPlugin } from "~/content/plugins/ContentModelPlugin";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeModelCreate } from "./contentModel/beforeCreate";
import { assignBeforeModelUpdate } from "./contentModel/beforeUpdate";
import { assignBeforeModelDelete } from "./contentModel/beforeDelete";
import { assignAfterModelCreate } from "./contentModel/afterCreate";
import { assignAfterModelUpdate } from "./contentModel/afterUpdate";
import { assignAfterModelDelete } from "./contentModel/afterDelete";

export interface Params {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}
export const createModelsCrud = (params: Params): CmsContentModelContext => {
    const { getTenant, getIdentity, getLocale, storageOperations, context } = params;

    const loaders = {
        listModels: new DataLoader(async () => {
            const models = await storageOperations.models.list({
                where: {
                    tenant: getTenant().id,
                    locale: getLocale().code
                }
            });
            return [
                models.map(model => {
                    return {
                        ...model,
                        tenant: model.tenant || getTenant().id,
                        locale: model.locale || getLocale().code
                    };
                })
            ];
        })
    };

    const managers = new Map<string, CmsContentModelManager>();
    const updateManager = async (
        context: CmsContext,
        model: CmsContentModel
    ): Promise<CmsContentModelManager> => {
        const manager = await contentModelManagerFactory(context, model);
        managers.set(model.modelId, manager);
        return manager;
    };

    const checkModelPermissions = (check: string): Promise<CmsContentModelPermission> => {
        return utils.checkPermissions(context, "cms.contentModel", { rwd: check });
    };

    const getContentModelsAsPlugins = (): CmsContentModel[] => {
        const tenant = getTenant().id;
        const locale = getLocale().code;

        return (
            context.plugins
                .byType<ContentModelPlugin>(ContentModelPlugin.type)
                /**
                 * We need to filter out models that are not for this tenant or locale.
                 * If it does not have tenant or locale define, it is for every locale and tenant
                 */
                .filter(plugin => {
                    const { tenant: t, locale: l } = plugin.contentModel;
                    if (t && t !== tenant) {
                        return false;
                    } else if (l && l !== locale) {
                        return false;
                    }
                    return true;
                })
                .map<CmsContentModel>(plugin => {
                    return {
                        ...plugin.contentModel,
                        tenant,
                        locale,
                        webinyVersion: context.WEBINY_VERSION
                    };
                })
        );
    };

    const modelsGet = async (modelId: string): Promise<CmsContentModel> => {
        const pluginModel: CmsContentModel = getContentModelsAsPlugins().find(
            model => model.modelId === modelId
        );

        if (pluginModel) {
            return pluginModel;
        }

        const model = await storageOperations.models.get({
            tenant: getTenant().id,
            locale: getLocale().code,
            modelId
        });

        if (!model) {
            throw new NotFoundError(`Content model "${modelId}" was not found!`);
        }

        return {
            ...model,
            tenant: model.tenant || getTenant().id,
            locale: model.locale || getLocale().code
        };
    };

    const modelsList = async (): Promise<CmsContentModel[]> => {
        const databaseModels = await loaders.listModels.load("listModels");

        const pluginsModels = getContentModelsAsPlugins();

        return databaseModels.concat(pluginsModels);
    };

    const listOperations = async () => {
        const permission = await checkModelPermissions("r");
        const models = await modelsList();
        return utils.filterAsync(models, async model => {
            if (!utils.validateOwnership(context, permission, model)) {
                return false;
            }
            return utils.validateModelAccess(context, model);
        });
    };

    const get = async (modelId: string) => {
        const permission = await checkModelPermissions("r");

        const model = await modelsGet(modelId);

        utils.checkOwnership(context, permission, model);
        await utils.checkModelAccess(context, model);

        return model;
    };

    const getManager = async (modelId: string): Promise<CmsContentModelManager> => {
        if (managers.has(modelId)) {
            return managers.get(modelId);
        }
        const models = await modelsList();
        const model = models.find(m => m.modelId === modelId);
        if (!model) {
            throw new NotFoundError(`There is no content model "${modelId}".`);
        }
        return await updateManager(context, model);
    };

    const onBeforeCreate = createTopic<BeforeModelCreateTopicParams>();
    const onAfterCreate = createTopic<AfterModelCreateTopicParams>();
    const onBeforeUpdate = createTopic<BeforeModelUpdateTopicParams>();
    const onAfterUpdate = createTopic<AfterModelUpdateTopicParams>();
    const onBeforeDelete = createTopic<BeforeModelDeleteTopicParams>();
    const onAfterDelete = createTopic<AfterModelDeleteTopicParams>();
    /**
     * We need to assign some default behaviors.
     */
    assignBeforeModelCreate({
        onBeforeCreate,
        plugins: context.plugins,
        storageOperations
    });
    assignAfterModelCreate({
        context,
        onAfterCreate
    });
    assignBeforeModelUpdate({
        onBeforeUpdate,
        plugins: context.plugins,
        storageOperations
    });
    assignAfterModelUpdate({
        context,
        onAfterUpdate
    });
    assignBeforeModelDelete({
        onBeforeDelete,
        plugins: context.plugins,
        storageOperations
    });
    assignAfterModelDelete({
        context,
        onAfterDelete
    });

    return {
        onBeforeModelCreate: onBeforeCreate,
        onAfterModelCreate: onAfterCreate,
        onBeforeModelUpdate: onBeforeUpdate,
        onAfterModelUpdate: onAfterUpdate,
        onBeforeModelDelete: onBeforeDelete,
        onAfterModelDelete: onAfterDelete,
        noAuthModel: () => {
            return {
                get: modelsGet,
                list: modelsList
            };
        },
        silentAuthModel: () => {
            return {
                list: async () => {
                    try {
                        return await listOperations();
                    } catch (ex) {
                        if (ex instanceof NotAuthorizedError) {
                            return [];
                        }
                        throw ex;
                    }
                }
            };
        },
        getModel: get,
        listModels: listOperations,
        async createModel(inputData) {
            await checkModelPermissions("w");

            const createdData = new CreateContentModelModel().populate(inputData);
            await createdData.validate();
            const input = await createdData.toJSON();

            const group = await context.cms.noAuthGroup().get(input.group);
            if (!group) {
                throw new NotFoundError(`There is no group "${input.group}".`);
            }

            const identity = getIdentity();
            const model: CmsContentModel = {
                ...input,
                titleFieldId: "id",
                locale: getLocale().code,
                tenant: getTenant().id,
                group: {
                    id: group.id,
                    name: group.name
                },
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                fields: [],
                lockedFields: [],
                layout: [],
                webinyVersion: context.WEBINY_VERSION
            };

            await onBeforeCreate.publish({
                model,
                input
            });

            const createdModel = await storageOperations.models.create({
                input,
                model
            });

            loaders.listModels.clearAll();

            await updateManager(context, model);

            await onAfterCreate.publish({
                input,
                model: createdModel
            });

            return createdModel;
        },
        /**
         * Method does not check for permissions or ownership.
         * @internal
         */
        async updateModelDirect(params) {
            const { model: initialModel, original } = params;

            const model: CmsContentModel = {
                ...initialModel,
                tenant: initialModel.tenant || getTenant().id,
                locale: initialModel.locale || getLocale().code,
                webinyVersion: context.WEBINY_VERSION
            };

            await onBeforeUpdate.publish({
                input: {} as any,
                original,
                model
            });

            const resultModel = await storageOperations.models.update({
                original,
                model,
                input: {} as any
            });

            await updateManager(context, resultModel);

            loaders.listModels.clearAll();

            await onAfterUpdate.publish({
                input: {} as any,
                original,
                model: resultModel
            });

            return resultModel;
        },
        async updateModel(modelId, inputData) {
            await checkModelPermissions("w");

            // Get a model record; this will also perform ownership validation.
            const original = await get(modelId);

            const updatedData = new UpdateContentModelModel().populate(inputData);
            await updatedData.validate();

            const input = await updatedData.toJSON({ onlyDirty: true });
            if (Object.keys(input).length === 0) {
                return {} as any;
            }
            if (input.group) {
                const group = await context.cms.noAuthGroup().get(input.group);
                if (!group) {
                    throw new NotFoundError(`There is no group "${input.group}".`);
                }
                input.group = {
                    id: group.id,
                    name: group.name
                };
            }
            const modelFields = await createFieldModels(original, inputData);
            validateLayout(input, modelFields);
            const model: CmsContentModel = {
                ...original,
                ...input,
                tenant: original.tenant || getTenant().id,
                locale: original.locale || getLocale().code,
                webinyVersion: context.WEBINY_VERSION,
                fields: modelFields,
                savedOn: new Date().toISOString()
            };

            await onBeforeUpdate.publish({
                input,
                original,
                model
            });

            const resultModel = await storageOperations.models.update({
                original,
                model,
                input
            });

            await updateManager(context, resultModel);

            await onAfterUpdate.publish({
                original,
                model: resultModel,
                input
            });

            return resultModel;
        },
        async deleteModel(modelId) {
            await checkModelPermissions("d");

            const model = await get(modelId);

            await onBeforeDelete.publish({
                model
            });

            try {
                await storageOperations.models.delete({
                    model
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete the content model",
                    ex.code || "CONTENT_MODEL_DELETE_ERROR",
                    {
                        error: ex,
                        modelId: model.modelId
                    }
                );
            }

            await onAfterDelete.publish({
                model
            });

            managers.delete(model.modelId);
        },
        getModelManager: getManager,
        getManagers: () => managers
    };
};
