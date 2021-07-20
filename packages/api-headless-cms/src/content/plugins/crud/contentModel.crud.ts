import { ContextPlugin } from "@webiny/handler/types";
import {
    CmsContext,
    CmsContentModel,
    CmsContentModelContext,
    CmsContentModelManager,
    CmsContentModelPermission,
    CmsContentModelStorageOperationsProvider,
    CmsContentModelUpdateInput
} from "~/types";
import * as utils from "~/utils";
import DataLoader from "dataloader";
import { NotFoundError } from "@webiny/handler-graphql";
import { contentModelManagerFactory } from "./contentModel/contentModelManagerFactory";
import { CreateContentModelModel, UpdateContentModelModel } from "./contentModel/models";
import { createFieldModels } from "./contentModel/createFieldModels";
import { validateLayout } from "./contentModel/validateLayout";
import {
    beforeCreateHook,
    afterCreateHook,
    beforeUpdateHook,
    afterUpdateHook,
    beforeDeleteHook,
    afterDeleteHook
} from "./contentModel/hooks";
import { NotAuthorizedError } from "@webiny/api-security";
import WebinyError from "@webiny/error";
import { ContentModelPlugin } from "@webiny/api-headless-cms/content/plugins/ContentModelPlugin";

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-storageOperations",
    async apply(context) {
        const pluginType = "cms-content-model-storage-operations-provider";
        const providerPlugins = context.plugins.byType<CmsContentModelStorageOperationsProvider>(
            pluginType
        );
        /**
         * Storage operations for the content model.
         * Contains logic to save the data into the specific storage.
         */
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if (!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }

        const storageOperations = await providerPlugin.provide({
            context
        });

        const loaders = {
            listModels: new DataLoader(async () => {
                const models = await storageOperations.list();
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

        const modelsGet = async (modelId: string) => {
            const pluginModel: ContentModelPlugin = context.plugins
                .byType<ContentModelPlugin>(ContentModelPlugin.type)
                .find(plugin => plugin.contentModel.modelId === modelId);

            if (pluginModel) {
                return pluginModel.contentModel;
            }

            const databaseModel = await storageOperations.get({
                id: modelId
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
                .map<CmsContentModel>(plugin => plugin.contentModel);

            return [...databaseModels, ...pluginsModels];
        };

        const models: CmsContentModelContext = {
            operations: storageOperations,
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
                            return await models.list();
                        } catch (ex) {
                            if (ex instanceof NotAuthorizedError) {
                                return [];
                            }
                            throw ex;
                        }
                    }
                };
            },
            async get(modelId) {
                const permission = await checkModelPermissions("r");

                const model = await modelsGet(modelId);

                utils.checkOwnership(context, permission, model);
                await utils.checkModelAccess(context, model);

                return model;
            },
            async list() {
                const permission = await checkModelPermissions("r");
                const models = await modelsList();
                return utils.filterAsync(models, async model => {
                    if (!utils.validateOwnership(context, permission, model)) {
                        return false;
                    }
                    return utils.validateModelAccess(context, model);
                });
            },
            async create(inputData) {
                await checkModelPermissions("w");

                const createdData = new CreateContentModelModel().populate(inputData);
                await createdData.validate();
                const input = await createdData.toJSON();

                const group = await context.cms.groups.noAuth().get(input.group);
                if (!group) {
                    throw new NotFoundError(`There is no group "${input.group}".`);
                }

                const identity = context.security.getIdentity();
                const data: CmsContentModel = {
                    ...input,
                    titleFieldId: "id",
                    locale: context.cms.getLocale().code,
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

                await beforeCreateHook({ context, storageOperations, input, data });

                const model = await storageOperations.create({
                    input,
                    data
                });

                await updateManager(context, model);

                await afterCreateHook({ context, storageOperations, input, model });

                return model;
            },
            /**
             * Method does not check for permissions or ownership.
             * @internal
             */
            async updateModel(model, data) {
                const input = (data as unknown) as CmsContentModelUpdateInput;
                await beforeUpdateHook({
                    context,
                    storageOperations,
                    model,
                    data,
                    input
                });

                const resultModel = await storageOperations.update({
                    data,
                    model,
                    input
                });

                await updateManager(context, resultModel);

                await afterUpdateHook({
                    context,
                    storageOperations,
                    model: resultModel,
                    data,
                    input
                });

                return resultModel;
            },
            async update(modelId, inputData) {
                await checkModelPermissions("w");

                // Get a model record; this will also perform ownership validation.
                const model = await context.cms.models.get(modelId);

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
                const modelFields = await createFieldModels(model, inputData);
                validateLayout(input, modelFields);
                const data: Partial<CmsContentModel> = {
                    ...input,
                    fields: modelFields,
                    savedOn: new Date().toISOString()
                };

                await beforeUpdateHook({
                    context,
                    storageOperations,
                    model,
                    data,
                    input
                });

                const resultModel = await storageOperations.update({
                    data,
                    model,
                    input
                });

                await updateManager(context, resultModel);

                await afterUpdateHook({
                    context,
                    storageOperations,
                    model: resultModel,
                    data,
                    input
                });

                return resultModel;
            },
            async delete(modelId) {
                await checkModelPermissions("d");

                const model = await context.cms.models.get(modelId);

                await beforeDeleteHook({
                    context,
                    storageOperations,
                    model
                });

                const result = await storageOperations.delete({
                    model
                });
                if (!result) {
                    throw new WebinyError(
                        "Could not delete the content model",
                        "CONTENT_MODEL_DELETE_ERROR",
                        {
                            modelId: model.modelId
                        }
                    );
                }

                await afterDeleteHook({ context, storageOperations, model });

                managers.delete(model.modelId);
            },
            async getManager(modelId) {
                if (managers.has(modelId)) {
                    return managers.get(modelId);
                }
                const models = await modelsList();
                const model = models.find(m => m.modelId === modelId);
                if (!model) {
                    throw new NotFoundError(`There is no content model "${modelId}".`);
                }
                return await updateManager(context, model);
            },
            getManagers: () => managers
        };

        context.cms = {
            ...(context.cms || ({} as any)),
            models,
            getModel: (modelId: string) => {
                return models.getManager(modelId);
            }
        };
    }
});
