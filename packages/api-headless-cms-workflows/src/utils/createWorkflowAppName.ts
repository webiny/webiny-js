import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface IParams {
    model: Pick<CmsModel, "modelId">;
}
export const createWorkflowAppName = ({ model }: IParams) => {
    return `cms:${model.modelId}`;
};
