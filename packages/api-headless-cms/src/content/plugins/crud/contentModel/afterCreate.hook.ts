import { CmsContentModel, CmsContext } from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}

export const afterCreateHook = async (args: Args): Promise<void> => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();
    await runContentModelLifecycleHooks("afterCreate", args);
};
