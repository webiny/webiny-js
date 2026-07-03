import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Context } from "~/types.js";
import { createGroupData } from "./group.js";
import { createCarsModel } from "./model.js";
import { createIndex } from "~/utils/index.js";
import { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-ddb-es/exports/api/cms/opensearch.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { ListGroupsUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/ListGroups/index.js";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";

interface ICreateModelAndGroupParams {
    context: Context;
    modelId: string;
    overwrite?: boolean;
}
export interface ICreateModelAndGroupResultSuccess {
    group: CmsGroup;
    model: CmsModel;
}
export type ICreateModelAndGroupResult = string | ICreateModelAndGroupResultSuccess;

export const createModelAndGroup = async (
    params: ICreateModelAndGroupParams
): Promise<ICreateModelAndGroupResult> => {
    const { context, modelId, overwrite = false } = params;
    /**
     * First we need to check if the model already exists in the database. If not, we need to create it.
     */
    const modelsResult = await context.container.resolve(ListModelsUseCase).execute();
    if (modelsResult.isFail()) {
        throw modelsResult.error;
    }
    let model = modelsResult.value.find(m => m.modelId === modelId);
    let group: CmsGroup | undefined;
    if (model && !overwrite) {
        return `Model "${modelId}" already exists.`;
    } else if (!model) {
        const groupsResult = await context.container.resolve(ListGroupsUseCase).execute();
        if (groupsResult.isFail()) {
            throw groupsResult.error;
        }
        group = groupsResult.value.find(g => g.slug === "mocks");
        if (!group) {
            const groupData = createGroupData();
            const createGroupResult = await context.container
                .resolve(CreateGroupUseCase)
                .execute(groupData);
            if (createGroupResult.isFail()) {
                throw createGroupResult.error;
            }
            group = createGroupResult.value;
        }
        /**
         * Possibly we need to create the model.
         */
        const carsModel = createCarsModel(group);
        const createModelResult = await context.container
            .resolve(CreateModelUseCase)
            .execute(carsModel);
        if (createModelResult.isFail()) {
            throw createModelResult.error;
        }
        model = createModelResult.value;
    }
    await createIndex({
        model,
        client: context.container.resolve(OpenSearchClient).use(),
        indexConfigs: context.container.resolveAll(CmsEntryOpenSearchIndex)
    });

    return {
        group: group as CmsGroup,
        model: model as CmsModel
    };
};
