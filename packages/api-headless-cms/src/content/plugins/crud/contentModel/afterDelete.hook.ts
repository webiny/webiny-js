import {
    CmsContentModelHookPluginArgs,
    CmsContentModelCrud,
    CmsContentModelCrudAfterDeleteArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelCrudAfterDeleteArgs {
    context: CmsContext;
    crud: CmsContentModelCrud;
}
export const afterDeleteHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();

    await runContentModelLifecycleHooks<CmsContentModelHookPluginArgs>("afterDelete", args);
};
