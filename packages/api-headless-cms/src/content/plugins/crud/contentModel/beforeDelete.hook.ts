import { CmsContext } from "@webiny/api-headless-cms/types";

type BeforeDeleteHookArgsType = {
    modelId: string;
};
export const beforeDeleteHook = async (
    context: CmsContext,
    { modelId }: BeforeDeleteHookArgsType
) => {
    const manager = await context.cms.getModel(modelId);
    const entries = await manager.list({
        limit: 1
    });
    if (entries.length === 0) {
        return;
    }
    throw new Error(`Cannot delete content model "${modelId}" because there are existing entries.`);
};
