import DataLoader from "dataloader";
import WebinyError from "@webiny/error";
import {
    CmsContext,
    CmsModel,
    CmsModelContext,
    CmsModelManager,
    HeadlessCmsStorageOperations,
    OnModelBeforeCreateTopicParams,
    OnModelAfterCreateTopicParams,
    OnModelBeforeUpdateTopicParams,
    OnModelAfterUpdateTopicParams,
    OnModelBeforeDeleteTopicParams,
    OnModelAfterDeleteTopicParams,
    OnModelInitializeParams,
    OnModelBeforeCreateFromTopicParams,
    OnModelAfterCreateFromTopicParams,
    CmsModelUpdateInput,
    OnModelCreateErrorTopicParams,
    OnModelCreateFromErrorParams,
    OnModelUpdateErrorTopicParams,
    OnModelDeleteErrorTopicParams,
    CmsModelGroup
} from "~/types";

import { NotFoundError } from "@webiny/handler-graphql";
import { contentModelManagerFactory } from "./contentModel/contentModelManagerFactory";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignModelBeforeCreate } from "./contentModel/beforeCreate";
import { assignModelBeforeUpdate } from "./contentModel/beforeUpdate";
import { assignModelBeforeDelete } from "./contentModel/beforeDelete";
import { assignModelAfterCreate } from "./contentModel/afterCreate";
import { assignModelAfterUpdate } from "./contentModel/afterUpdate";
import { assignModelAfterDelete } from "./contentModel/afterDelete";
import { assignModelAfterCreateFrom } from "./contentModel/afterCreateFrom";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { checkPermissions } from "~/utils/permissions";
import { filterAsync } from "~/utils/filterAsync";
import { checkOwnership, validateOwnership } from "~/utils/ownership";
import { checkModelAccess, validateModelAccess } from "~/utils/access";
import {
    createModelCreateFromValidation,
    createModelCreateValidation,
    createModelUpdateValidation
} from "~/crud/contentModel/validation";
import { createZodError } from "@webiny/utils";
import { assignModelDefaultFields } from "~/crud/contentModel/defaultFields";

/**
 * Given a model, return an array of tags ensuring the `type` tag is set.
 */
const ensureTypeTag = (model: Pick<CmsModel, "tags">) => {
    // Let's make sure we have a `type` tag assigned.
    // If `type` tag is not set, set it to a default one (`model`).
    const tags = model.tags || [];
    if (!tags.some(tag => tag.startsWith("type:"))) {
        tags.push("type:model");
    }

    return tags;
};

export interface CreateModelsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}

export const createModelsCrud = (params: CreateModelsCrudParams): CmsModelContext => {
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
                        tags: ensureTypeTag(model),
                        tenant: model.tenant || getTenant().id,
                        locale: model.locale || getLocale().code
                    };
                })
            ];
        })
    };

    const clearModelsCache = (): void => {
        for (const loader of Object.values(loaders)) {
            loader.clearAll();
        }
    };

    const managers = new Map<string, CmsModelManager>();
    const updateManager = async (
        context: CmsContext,
        model: CmsModel
    ): Promise<CmsModelManager> => {
        const manager = await contentModelManagerFactory(context, model);
        managers.set(model.modelId, manager);
        return manager;
    };

    const checkModelPermissions = (check: string) => {
        return checkPermissions(context, "cms.contentModel", { rwd: check });
    };

    const getModelsAsPlugins = (): CmsModel[] => {
        const tenant = getTenant().id;
        const locale = getLocale().code;

        return (
            context.plugins
                .byType<CmsModelPlugin>(CmsModelPlugin.type)
                /**
                 * We need to filter out models that are not for this tenant or locale.
                 * If it does not have tenant or locale define, it is for every locale and tenant
                 */
                .filter(plugin => {
                    const { tenant: modelTenant, locale: modelLocale } = plugin.contentModel;
                    if (modelTenant && modelTenant !== tenant) {
                        return false;
                    } else if (modelLocale && modelLocale !== locale) {
                        return false;
                    }
                    return true;
                })
                .map<CmsModel>(plugin => {
                    return {
                        ...plugin.contentModel,
                        tags: ensureTypeTag(plugin.contentModel),
                        tenant,
                        locale,
                        webinyVersion: context.WEBINY_VERSION
                    };
                })
        );
    };

    const modelsGet = async (modelId: string): Promise<CmsModel> => {
        const pluginModel = getModelsAsPlugins().find(model => model.modelId === modelId);

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
            tags: ensureTypeTag(model),
            tenant: model.tenant || getTenant().id,
            locale: model.locale || getLocale().code
        };
    };

    const modelsList = async (): Promise<CmsModel[]> => {
        const databaseModels: CmsModel[] = await loaders.listModels.load("listModels");

        const pluginsModels = getModelsAsPlugins();

        return databaseModels.concat(pluginsModels);
    };

    const listModels = async () => {
        const permission = await checkModelPermissions("r");
        const models = await modelsList();
        return filterAsync(models, async model => {
            if (!validateOwnership(context, permission, model)) {
                return false;
            }
            return validateModelAccess(context, model);
        });
    };

    const getModel = async (modelId: string): Promise<CmsModel> => {
        const permission = await checkModelPermissions("r");

        const model = await modelsGet(modelId);

        checkOwnership(context, permission, model);
        await checkModelAccess(context, model);

        return model;
    };

    const getModelManager: CmsModelContext["getModelManager"] = async (
        target
    ): Promise<CmsModelManager> => {
        const modelId = typeof target === "string" ? target : target.modelId;
        if (managers.has(modelId)) {
            return managers.get(modelId) as CmsModelManager;
        }
        const models = await modelsList();
        const model = models.find(m => m.modelId === modelId);
        if (!model) {
            throw new NotFoundError(`There is no content model "${modelId}".`);
        }
        return await updateManager(context, model);
    };

    /**
     * Create
     */
    const onModelBeforeCreate =
        createTopic<OnModelBeforeCreateTopicParams>("cms.onModelBeforeCreate");
    const onModelAfterCreate = createTopic<OnModelAfterCreateTopicParams>("cms.onModelAfterCreate");
    const onModelCreateError = createTopic<OnModelCreateErrorTopicParams>("cms.onModelCreateError");
    /**
     * Create from / clone
     */
    const onModelBeforeCreateFrom = createTopic<OnModelBeforeCreateFromTopicParams>(
        "cms.onModelBeforeCreateFrom"
    );
    const onModelAfterCreateFrom = createTopic<OnModelAfterCreateFromTopicParams>(
        "cms.onModelAfterCreateFrom"
    );
    const onModelCreateFromError = createTopic<OnModelCreateFromErrorParams>(
        "cms.onModelCreateFromError"
    );
    /**
     * Update
     */
    const onModelBeforeUpdate =
        createTopic<OnModelBeforeUpdateTopicParams>("cms.onModelBeforeUpdate");
    const onModelAfterUpdate = createTopic<OnModelAfterUpdateTopicParams>("cms.onModelAfterUpdate");
    const onModelUpdateError = createTopic<OnModelUpdateErrorTopicParams>("cms.onModelUpdateError");
    /**
     * Delete
     */
    const onModelBeforeDelete =
        createTopic<OnModelBeforeDeleteTopicParams>("cms.onModelBeforeDelete");
    const onModelAfterDelete = createTopic<OnModelAfterDeleteTopicParams>("cms.onModelAfterDelete");
    const onModelDeleteError = createTopic<OnModelDeleteErrorTopicParams>("cms.onModelDeleteError");
    /**
     * Initialize
     */
    const onModelInitialize = createTopic<OnModelInitializeParams>("cms.onModelInitialize");
    /**
     * We need to assign some default behaviors.
     */
    assignModelBeforeCreate({
        onModelBeforeCreate,
        onModelBeforeCreateFrom,
        context,
        storageOperations
    });
    assignModelAfterCreate({
        context,
        onModelAfterCreate
    });
    assignModelBeforeUpdate({
        onModelBeforeUpdate,
        context
    });
    assignModelAfterUpdate({
        context,
        onModelAfterUpdate
    });
    assignModelAfterCreateFrom({
        context,
        onModelAfterCreateFrom
    });
    assignModelBeforeDelete({
        onModelBeforeDelete,
        plugins: context.plugins,
        storageOperations
    });
    assignModelAfterDelete({
        context,
        onModelAfterDelete
    });

    return {
        /**
         * Deprecated - will be removed in 5.36.0
         */
        onBeforeModelCreate: onModelBeforeCreate,
        onAfterModelCreate: onModelAfterCreate,
        onBeforeModelCreateFrom: onModelBeforeCreateFrom,
        onAfterModelCreateFrom: onModelAfterCreateFrom,
        onBeforeModelUpdate: onModelBeforeUpdate,
        onAfterModelUpdate: onModelAfterUpdate,
        onBeforeModelDelete: onModelBeforeDelete,
        onAfterModelDelete: onModelAfterDelete,
        /**
         * Released in 5.34.0
         */
        onModelBeforeCreate,
        onModelAfterCreate,
        onModelCreateError,
        onModelBeforeCreateFrom,
        onModelAfterCreateFrom,
        onModelCreateFromError,
        onModelBeforeUpdate,
        onModelAfterUpdate,
        onModelUpdateError,
        onModelBeforeDelete,
        onModelAfterDelete,
        onModelDeleteError,
        onModelInitialize,
        clearModelsCache,
        getModel,
        listModels,
        async createModel(input) {
            await checkModelPermissions("w");

            const result = await createModelCreateValidation().safeParseAsync(input);
            if (!result.success) {
                throw createZodError(result.error);
            }
            /**
             * We need to extract the defaultFields because it is not for the CmsModel object.
             */
            const { defaultFields, ...data } = result.data;

            if (defaultFields) {
                assignModelDefaultFields(data);
            }

            context.security.disableAuthorization();
            const group = await context.cms.getGroup(data.group);
            context.security.enableAuthorization();
            if (!group) {
                throw new NotFoundError(`There is no group "${data.group}".`);
            }

            const identity = getIdentity();
            const model: CmsModel = {
                ...data,
                modelId: data.modelId || "",
                titleFieldId: "id",
                descriptionFieldId: null,
                imageFieldId: null,
                description: data.description || "",
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
                lockedFields: [],
                webinyVersion: context.WEBINY_VERSION
            };

            model.tags = ensureTypeTag(model);

            try {
                await onModelBeforeCreate.publish({
                    input: data,
                    model
                });

                const createdModel = await storageOperations.models.create({
                    model
                });

                loaders.listModels.clearAll();

                await updateManager(context, model);

                await onModelAfterCreate.publish({
                    input: data,
                    model: createdModel
                });

                return createdModel;
            } catch (ex) {
                await onModelCreateError.publish({
                    input: data,
                    model,
                    error: ex
                });
                throw ex;
            }
        },
        /**
         * Method does not check for permissions or ownership.
         * @internal
         */
        async updateModelDirect(params) {
            const { model: initialModel, original } = params;

            const model: CmsModel = {
                ...initialModel,
                tenant: initialModel.tenant || getTenant().id,
                locale: initialModel.locale || getLocale().code,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onModelBeforeUpdate.publish({
                    input: {} as CmsModelUpdateInput,
                    original,
                    model
                });

                const resultModel = await storageOperations.models.update({
                    model
                });

                await updateManager(context, resultModel);

                loaders.listModels.clearAll();

                await onModelAfterUpdate.publish({
                    input: {} as CmsModelUpdateInput,
                    original,
                    model: resultModel
                });

                return resultModel;
            } catch (ex) {
                await onModelUpdateError.publish({
                    input: {} as CmsModelUpdateInput,
                    original,
                    model,
                    error: ex
                });
                throw ex;
            }
        },
        async createModelFrom(modelId, userInput) {
            await checkModelPermissions("w");
            /**
             * Get a model record; this will also perform ownership validation.
             */
            const original = await getModel(modelId);

            const result = await createModelCreateFromValidation().safeParseAsync({
                name: userInput.name,
                modelId: userInput.modelId,
                description: userInput.description || original.description,
                group: userInput.group,
                locale: userInput.locale
            });
            if (!result.success) {
                throw createZodError(result.error);
            }

            const data = result.data;

            const locale = await context.i18n.getLocale(data.locale || original.locale);
            if (!locale) {
                throw new NotFoundError(`There is no locale "${data.locale}".`);
            }
            /**
             * Use storage operations directly because we cannot get group from different locale via context methods.
             */
            const group = await context.cms.storageOperations.groups.get({
                id: data.group,
                tenant: original.tenant,
                locale: locale.code
            });
            if (!group) {
                throw new NotFoundError(`There is no group "${data.group}".`);
            }

            const identity = getIdentity();
            const model: CmsModel = {
                ...original,
                locale: locale.code,
                group: {
                    id: group.id,
                    name: group.name
                },
                name: data.name,
                modelId: data.modelId || "",
                description: data.description || "",
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                lockedFields: [],
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onModelBeforeCreateFrom.publish({
                    input: data,
                    model,
                    original
                });

                const createdModel = await storageOperations.models.create({
                    model
                });

                loaders.listModels.clearAll();

                await updateManager(context, model);

                await onModelAfterCreateFrom.publish({
                    input: data,
                    original,
                    model: createdModel
                });

                return createdModel;
            } catch (ex) {
                await onModelCreateFromError.publish({
                    input: data,
                    original,
                    model,
                    error: ex
                });
                throw ex;
            }
        },
        async updateModel(modelId, input) {
            await checkModelPermissions("w");

            // Get a model record; this will also perform ownership validation.
            const original = await getModel(modelId);

            const result = await createModelUpdateValidation().safeParseAsync(input);
            if (!result.success) {
                throw createZodError(result.error);
            }

            const data = result.data;

            if (Object.keys(data).length === 0) {
                /**
                 * We need to return the original if nothing is to be updated.
                 */
                return original;
            }
            let group: CmsModelGroup = {
                id: original.group.id,
                name: original.group.name
            };
            if (data.group) {
                context.security.disableAuthorization();
                const groupData = await context.cms.getGroup(data.group);
                context.security.enableAuthorization();
                if (!groupData) {
                    throw new NotFoundError(`There is no group "${data.group}".`);
                }
                group = {
                    id: groupData.id,
                    name: groupData.name
                };
            }
            const model: CmsModel = {
                ...original,
                ...data,
                titleFieldId: data.titleFieldId as string,
                descriptionFieldId: data.descriptionFieldId,
                imageFieldId: data.imageFieldId,
                group,
                description: data.description || original.description,
                tenant: original.tenant || getTenant().id,
                locale: original.locale || getLocale().code,
                webinyVersion: context.WEBINY_VERSION,
                savedOn: new Date().toISOString()
            };

            model.tags = ensureTypeTag(model);

            try {
                await onModelBeforeUpdate.publish({
                    input: data,
                    original,
                    model
                });

                const resultModel = await storageOperations.models.update({
                    model
                });

                await updateManager(context, resultModel);

                await onModelAfterUpdate.publish({
                    input: data,
                    original,
                    model: resultModel
                });

                return resultModel;
            } catch (ex) {
                await onModelUpdateError.publish({
                    input: data,
                    model,
                    original,
                    error: ex
                });

                throw ex;
            }
        },
        async deleteModel(modelId) {
            await checkModelPermissions("d");

            const model = await getModel(modelId);

            try {
                await onModelBeforeDelete.publish({
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

                await onModelAfterDelete.publish({
                    model
                });

                managers.delete(model.modelId);
            } catch (ex) {
                await onModelDeleteError.publish({
                    model,
                    error: ex
                });
                throw ex;
            }
        },
        async initializeModel(modelId, data) {
            /**
             * We require that users have write permissions to initialize models.
             * Maybe introduce another permission for it?
             */
            await checkModelPermissions("w");

            const model = await getModel(modelId);

            await onModelInitialize.publish({ model, data });

            return true;
        },
        getModelManager,
        getEntryManager: async model => {
            return getModelManager(model);
        },
        getManagers: () => managers,
        getEntryManagers: () => managers
    };
};
