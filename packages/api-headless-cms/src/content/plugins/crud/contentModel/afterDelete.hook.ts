import { CmsContentModel, CmsContext } from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}
export const afterDeleteHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();

    await runContentModelLifecycleHooks("afterDelete", args);
};
