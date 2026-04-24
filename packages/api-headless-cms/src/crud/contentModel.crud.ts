import WebinyError from "@webiny/error";
import type { CmsContext, CmsModel, CmsModelContext, ICmsModelListParams } from "~/types/index.js";
import { CreateModelUseCase } from "~/features/contentModel/CreateModel/index.js";
import { CreateModelFromUseCase } from "~/features/contentModel/CreateModelFrom/index.js";
import { UpdateModelUseCase } from "~/features/contentModel/UpdateModel/index.js";
import { DeleteModelUseCase } from "~/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import { createMemoryCache } from "~/utils/index.js";
import {
    CmsModelFieldToAstConverterFromPlugins,
    CmsModelToAstConverter
} from "~/utils/contentModelAst/index.js";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

export interface CreateModelsCrudParams {
    context: CmsContext;
}

export const createModelsCrud = (params: CreateModelsCrudParams): CmsModelContext => {
    const { context } = params;

    const listFilteredModelsCache = createMemoryCache<Promise<CmsModel[]>>();
    const listDatabaseModelsCache = createMemoryCache<Promise<CmsModel[]>>();
    const clearModelsCache = (): void => {
        listDatabaseModelsCache.clear();
        listFilteredModelsCache.clear();
    };

    const fieldTypePlugins = context.container.resolve(CmsModelFieldToGraphQLRegistry).getAll();

    const getModelToAstConverter = () => {
        return new CmsModelToAstConverter(
            new CmsModelFieldToAstConverterFromPlugins(fieldTypePlugins)
        );
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
     * CRUD methods
     */
    const createModel: CmsModelContext["createModel"] = async input => {
        // Delegate to new CreateModel use case
        const useCase = context.container.resolve(CreateModelUseCase);
        const result = await useCase.execute(input);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }

        return result.value;
    };
    const updateModel: CmsModelContext["updateModel"] = async (modelId, input) => {
        // Delegate to new UpdateModel use case
        const useCase = context.container.resolve(UpdateModelUseCase);
        const result = await useCase.execute(modelId, input);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }

        return result.value;
    };

    const createModelFrom: CmsModelContext["createModelFrom"] = async (modelId, input) => {
        // Delegate to new CreateModelFrom use case
        const useCase = context.container.resolve(CreateModelFromUseCase);
        const result = await useCase.execute(modelId, input);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }

        return result.value;
    };
    const deleteModel: CmsModelContext["deleteModel"] = async modelId => {
        // Delegate to new DeleteModel use case
        const useCase = context.container.resolve(DeleteModelUseCase);
        const result = await useCase.execute(modelId);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
        }
    };

    return {
        clearModelsCache,
        getModel,
        getModelToAstConverter,
        listModels,
        async createModel(input) {
            return context.benchmark.measure("headlessCms.crud.models.createModel", async () => {
                return createModel(input);
            });
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
        }
    };
};
