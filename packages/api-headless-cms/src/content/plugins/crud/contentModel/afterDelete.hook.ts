import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import { runContentModelLifecycleHooks } from "./hooks";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}
export const afterDeleteHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();

    await runContentModelLifecycleHooks("afterDelete", args);
};
