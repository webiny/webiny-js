import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface IParams {
    model: Pick<CmsModel, "modelId">;
}
export const createWorkflowAppName = ({ model }: IParams): string => {
    return `cms:${model.modelId}`;
};

export const getModelIdFromAppName = (app: string): string | null => {
    const matched = app.match(/^cms:([a-zA-Z0-9_-]+)$/);
    if (!matched) {
        return null;
    }
    return matched ? matched[1] : null;
};
