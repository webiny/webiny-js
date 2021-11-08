import {
    CmsContext,
    CmsContentModel,
    CmsContentModelContext,
    CmsContentModelManager,
    CmsContentModelPermission,
    CmsContentModelUpdateInput,
    HeadlessCmsStorageOperations,
    BeforeCreateModelTopic,
    AfterCreateModelTopic,
    BeforeUpdateModelTopic,
    AfterUpdateModelTopic,
    BeforeDeleteModelTopic,
    AfterDeleteModelTopic
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
import { ContentModelPlugin } from "@webiny/api-headless-cms/content/plugins/ContentModelPlugin";
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
            return [models];
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

    const modelsGet = async (modelId: string): Promise<CmsContentModel> => {
        const pluginModel: ContentModelPlugin = context.plugins
            .byType<ContentModelPlugin>(ContentModelPlugin.type)
            .find(plugin => plugin.contentModel.modelId === modelId);

        if (pluginModel) {
            /**
             * TODO figure out TS does not recognize CmsContentModel from ContentModelPlugin
             */
            return pluginModel.contentModel as CmsContentModel;
        }

        const databaseModel = await storageOperations.models.get({
            tenant: getTenant().id,
            locale: getLocale().code,
            modelId
        });

        if (!databaseModel) {
            throw new NotFoundError(`Content model "${modelId}" was not found!`);
        }

        return databaseModel;
    };

    const modelsList = async (): Promise<CmsContentModel[]> => {
        const databaseModels = await loaders.listModels.load("listModels");

        const pluginsModels: CmsContentModel[] = context.plugins
            .byType<ContentModelPlugin>(ContentModelPlugin.type)
            .map<CmsContentModel>(plugin => plugin.contentModel as CmsContentModel);

        return [...databaseModels, ...pluginsModels];
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

    context.cms.getModel = getManager;

    const onBeforeCreate = createTopic<BeforeCreateModelTopic>();
    const onAfterCreate = createTopic<AfterCreateModelTopic>();
    const onBeforeUpdate = createTopic<BeforeUpdateModelTopic>();
    const onAfterUpdate = createTopic<AfterUpdateModelTopic>();
    const onBeforeDelete = createTopic<BeforeDeleteModelTopic>();
    const onAfterDelete = createTopic<AfterDeleteModelTopic>();
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
        onBeforeCreate,
        onAfterCreate,
        onBeforeUpdate,
        onAfterUpdate,
        onBeforeDelete,
        onAfterDelete,
        operations: storageOperations.models,
        noAuth: () => {
            return {
                get: modelsGet,
                list: modelsList
            };
        },
        silentAuth: () => {
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
        get,
        list: listOperations,
        async create(inputData) {
            await checkModelPermissions("w");

            const createdData = new CreateContentModelModel().populate(inputData);
            await createdData.validate();
            const input = await createdData.toJSON();

            const group = await context.cms.groups.noAuth().get(input.group);
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
                layout: []
            };

            await onBeforeCreate.publish({
                model,
                input
            });

            const createdModel = await storageOperations.models.create({
                input,
                model
            });

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
        async updateModel(model, data) {
            const input = data as unknown as CmsContentModelUpdateInput;
            // await beforeUpdateHook({
            //     context,
            //     storageOperations: storageOperations.models,
            //     model,
            //     data,
            //     input
            // });

            // await onBeforeUpdate.publish({
            //     model,
            // })

            const resultModel = await storageOperations.models.update({
                original: model,
                model,
                input
            });

            await updateManager(context, resultModel);

            // await afterUpdateHook({
            //     context,
            //     storageOperations: storageOperations.models,
            //     model: resultModel,
            //     data,
            //     input
            // });

            return resultModel;
        },
        async update(modelId, inputData) {
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
                const group = await context.cms.groups.noAuth().get(input.group);
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
        async delete(modelId) {
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
                        model
                    }
                );
            }

            await onAfterDelete.publish({
                model
            });

            managers.delete(model.modelId);
        },
        getManager,
        getManagers: () => managers
    };
};
