import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}
export const afterUpdateHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();
    await runContentModelLifecycleHooks("afterUpdate", args);
};
