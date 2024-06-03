import { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types";
import { Context } from "~/types";
import { createGroupData } from "./group";
import { createCarsModel } from "./model";

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
    let model = (await context.cms.listModels()).find(m => m.modelId === modelId);
    let group: CmsGroup | undefined;
    if (model && !overwrite) {
        return `Model "${modelId}" already exists.`;
    } else if (!model) {
        group = (await context.cms.listGroups()).find(group => group.slug === "mocks");
        if (!group) {
            const groupData = createGroupData();
            group = await context.cms.createGroup(groupData);
        }
        /**
         * Possibly we need to create the model.
         */
        const carsModel = createCarsModel(group);
        model = await context.cms.createModel(carsModel);
    }
    return {
        group: group as CmsGroup,
        model: model as CmsModel
    };
};
