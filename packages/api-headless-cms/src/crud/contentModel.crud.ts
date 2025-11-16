import WebinyError from "@webiny/error";
import type {
    CmsContext,
    CmsEntryValues,
    CmsModel,
    CmsModelContext,
    CmsModelFieldToGraphQLPlugin,
    CmsModelGroup,
    CmsModelManager,
    CmsModelUpdateInput,
    HeadlessCmsStorageOperations,
    ICmsModelListParams,
    OnModelAfterCreateFromTopicParams,
    OnModelAfterCreateTopicParams,
    OnModelAfterDeleteTopicParams,
    OnModelAfterUpdateTopicParams,
    OnModelBeforeCreateFromTopicParams,
    OnModelBeforeCreateTopicParams,
    OnModelBeforeDeleteTopicParams,
    OnModelBeforeUpdateTopicParams,
    OnModelCreateErrorTopicParams,
    OnModelCreateFromErrorParams,
    OnModelDeleteErrorTopicParams,
    OnModelInitializeParams,
    OnModelUpdateErrorTopicParams
} from "~/types/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { contentModelManagerFactory } from "./contentModel/contentModelManagerFactory.js";
import { createTopic } from "@webiny/pubsub";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin.js";
import {
    createModelCreateFromValidation,
    createModelUpdateValidation
} from "~/crud/contentModel/validation.js";
import { createZodError, removeUndefinedValues } from "@webiny/utils";
import { CreateModelUseCase } from "~/features/contentModel/CreateModel/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import { createCacheKey, createMemoryCache } from "~/utils/index.js";
import { ensureTypeTag } from "./contentModel/ensureTypeTag.js";
import { filterAsync } from "~/utils/filterAsync.js";
import type { AccessControl } from "./AccessControl/AccessControl.js";
import {
    CmsModelFieldToAstConverterFromPlugins,
    CmsModelToAstConverter
} from "~/utils/contentModelAst/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export interface CreateModelsCrudParams {
    getTenant: () => Tenant;
    storageOperations: HeadlessCmsStorageOperations;
    accessControl: AccessControl;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}

export const createModelsCrud = (params: CreateModelsCrudParams): CmsModelContext => {
    const { getTenant, getIdentity, storageOperations, accessControl, context } = params;

    const listPluginModelsCache = createMemoryCache<Promise<CmsModel[]>>();
    const listFilteredModelsCache = createMemoryCache<Promise<CmsModel[]>>();
    const listDatabaseModelsCache = createMemoryCache<Promise<CmsModel[]>>();
    const clearModelsCache = (): void => {
        listDatabaseModelsCache.clear();
        listFilteredModelsCache.clear();
    };

    const managers = new Map<string, CmsModelManager>();
    const updateManager = async <T extends CmsEntryValues = CmsEntryValues>(
        context: CmsContext,
        model: CmsModel
    ): Promise<CmsModelManager<T>> => {
        const manager = await contentModelManagerFactory<T>(context, model);
        managers.set(model.modelId, manager);
        return manager;
    };

    const fieldTypePlugins = context.plugins.byType<CmsModelFieldToGraphQLPlugin>(
        "cms-model-field-to-graphql"
    );

    const getModelToAstConverter = () => {
        return new CmsModelToAstConverter(
            new CmsModelFieldToAstConverterFromPlugins(fieldTypePlugins)
        );
    };

    const listPluginModels = async (tenant: string, locale: string): Promise<CmsModel[]> => {
        const modelPlugins = context.plugins.byType<CmsModelPlugin>(CmsModelPlugin.type);
        const cacheKey = createCacheKey({
            tenant,
            locale,
            models: modelPlugins
                .map(({ contentModel: model }) => {
                    return `${model.modelId}#${model.pluralApiName}#${model.singularApiName}#${
                        model.savedOn || "savedOn:plugin"
                    }`;
                })
                .join("/"),
            identity: context.security.isAuthorizationEnabled() ? getIdentity()?.id : undefined
        });
        return listPluginModelsCache.getOrSet(cacheKey, async () => {
            const models = modelPlugins
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
                .map(plugin => {
                    return {
                        ...plugin.contentModel,
                        tags: ensureTypeTag(plugin.contentModel),
                        tenant,
                        locale,
                        webinyVersion: context.WEBINY_VERSION
                    };
                }) as unknown as CmsModel[];

            return filterAsync(models, async model => {
                return accessControl.canAccessModel({ model });
            });
        });
    };

    const getModelFromCache = async (modelId: string) => {
        const models = await listModels();
        const model = models.find(m => m.modelId === modelId);
        if (!model) {
            throw new NotFoundError(`Content model "${modelId}" was not found!`);
        }

        return {
            ...model,
            tags: ensureTypeTag(model),
            tenant: model.tenant || getTenant().id
        };
    };

    /**
     * The list models cache is a key -> Promise pair so it the listModels() can be called multiple times but executed only once.
     *
     * We always fetch the plugins and database models separately.
     * Then we combine them and run access filtering on them
     */
    const listModels = async (input?: ICmsModelListParams) => {
        return context.benchmark.measure("headlessCms.crud.models.listModels", async () => {
            // Delegate to new ListModels use case
            const useCase = context.container.resolve(ListModelsUseCase);
            const result = await useCase.execute(input);

            if (result.isFail()) {
                throw new WebinyError(result.error.message, result.error.code, result.error.data);
            }

            return result.value;
        });
    };

    const getModel = async (modelId: string): Promise<CmsModel> => {
        return context.benchmark.measure("headlessCms.crud.models.getModel", async () => {
            // Delegate to new GetModel use case
            const useCase = context.container.resolve(GetModelUseCase);
            const result = await useCase.execute(modelId);

            if (result.isFail()) {
                throw new WebinyError(result.error.message, result.error.code, result.error.data);
            }

            return result.value;
        });
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
     * CRUD methods
     */
    const createModel: CmsModelContext["createModel"] = async input => {
        // Delegate to new CreateModel use case
        const useCase = context.container.resolve(CreateModelUseCase);
        const result = await useCase.execute(input);

        if (result.isFail()) {
            const code = result.error.code;
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }

        return result.value;
    };
    const updateModel: CmsModelContext["updateModel"] = async (modelId, input) => {
        await accessControl.ensureCanAccessModel({ rwd: "w" });

        // Get a model record; this will also perform ownership validation.
        const original = await getModel(modelId);

        const result = await createModelUpdateValidation().safeParseAsync(input);
        if (!result.success) {
            throw createZodError(result.error);
        }

        const data = removeUndefinedValues(result.data);

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
        const groupId = data.group;
        if (groupId) {
            const groupData = await context.cms.getGroup(groupId);
            group = {
                id: groupData.id,
                name: groupData.name
            };
        }
        const model: CmsModel = {
            ...original,
            ...data,
            titleFieldId:
                data.titleFieldId === undefined
                    ? original.titleFieldId
                    : (data.titleFieldId as string),
            descriptionFieldId:
                data.descriptionFieldId === undefined
                    ? original.descriptionFieldId
                    : data.descriptionFieldId,
            imageFieldId:
                data.imageFieldId === undefined ? original.imageFieldId : data.imageFieldId,
            group,
            description: data.description || original.description,
            tenant: original.tenant || getTenant().id,
            webinyVersion: context.WEBINY_VERSION,
            savedOn: new Date().toISOString()
        };

        await accessControl.ensureCanAccessModel({ model, rwd: "w" });

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
    };
    const updateModelDirect: CmsModelContext["updateModelDirect"] = async params => {
        const { model: initialModel, original } = params;

        const model: CmsModel = {
            ...initialModel,
            tenant: initialModel.tenant || getTenant().id,
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

            clearModelsCache();

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
    };
    const createModelFrom: CmsModelContext["createModelFrom"] = async (modelId, input) => {
        await accessControl.ensureCanAccessModel({ rwd: "w" });

        /**
         * Get a model record; this will also perform ownership validation.
         */
        const original = await getModel(modelId);

        const result = await createModelCreateFromValidation().safeParseAsync({
            ...input,
            description: input.description || original.description
        });
        if (!result.success) {
            throw createZodError(result.error);
        }

        const data = removeUndefinedValues(result.data);

        /**
         * Use storage operations directly because we cannot get group from different locale via context methods.
         */
        const group = await context.cms.storageOperations.groups.get({
            id: data.group,
            tenant: original.tenant
        });
        if (!group) {
            throw new NotFoundError(`There is no group "${data.group}".`);
        }

        const identity = getIdentity();
        const model: CmsModel = {
            ...original,
            singularApiName: data.singularApiName,
            pluralApiName: data.pluralApiName,
            group: {
                id: group.id,
                name: group.name
            },
            icon: data.icon,
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

        await accessControl.ensureCanAccessModel({ model, rwd: "w" });

        try {
            await onModelBeforeCreateFrom.publish({
                input: data,
                model,
                original
            });

            const createdModel = await storageOperations.models.create({
                model
            });

            clearModelsCache();

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
    };
    const deleteModel: CmsModelContext["deleteModel"] = async modelId => {
        await accessControl.ensureCanAccessModel({ rwd: "d" });

        const model = await getModel(modelId);

        await accessControl.ensureCanAccessModel({ model, rwd: "d" });

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

            clearModelsCache();

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
    };
    const initializeModel: CmsModelContext["initializeModel"] = async (modelId, data) => {
        /**
         * We require that users have write permissions to initialize models.
         * Maybe introduce another permission for it?
         */
        const model = await getModel(modelId);

        await accessControl.ensureCanAccessModel({ model, rwd: "w" });

        await onModelInitialize.publish({ model, data });

        return true;
    };
    return {
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
        getModelToAstConverter,
        listModels,
        async createModel(input) {
            return context.benchmark.measure("headlessCms.crud.models.createModel", async () => {
                return createModel(input);
            });
        },
        /**
         * Method does not check for permissions or ownership.
         * @internal
         */
        async updateModelDirect(params) {
            return context.benchmark.measure(
                "headlessCms.crud.models.updateModelDirect",
                async () => {
                    return updateModelDirect(params);
                }
            );
        },
        async createModelFrom(modelId, userInput) {
            return context.benchmark.measure(
                "headlessCms.crud.models.createModelFrom",
                async () => {
                    return createModelFrom(modelId, userInput);
                }
            );
        },
        async updateModel(modelId, input) {
            return context.benchmark.measure("headlessCms.crud.models.updateModel", async () => {
                return updateModel(modelId, input);
            });
        },
        async deleteModel(modelId) {
            return context.benchmark.measure("headlessCms.crud.models.deleteModel", async () => {
                return deleteModel(modelId);
            });
        },
        async initializeModel(modelId, data) {
            return context.benchmark.measure(
                "headlessCms.crud.models.initializeModel",
                async () => {
                    return initializeModel(modelId, data);
                }
            );
        }
    };
};
