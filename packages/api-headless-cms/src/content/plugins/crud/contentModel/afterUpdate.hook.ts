import {
    CmsContentModelUpdateHookPluginArgs,
    CmsContentModelCrud,
    CmsContentModelCrudAfterUpdateArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelCrudAfterUpdateArgs {
    context: CmsContext;
    crud: CmsContentModelCrud;
}
export const afterUpdateHook = async (args: Args) => {
    const { context, crud, model, input } = args;
    await context.cms.settings.updateContentModelLastChange();
    await runContentModelLifecycleHooks<CmsContentModelUpdateHookPluginArgs>("afterUpdate", {
        context,
        crud,
        model,
        input
    });
};
