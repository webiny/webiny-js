import {
    CmsContentModelUpdateHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsAfterUpdateArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelStorageOperationsAfterUpdateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}
export const afterUpdateHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();
    if (args.storageOperations.afterUpdate) {
        await args.storageOperations.afterUpdate(args);
    }
    await runContentModelLifecycleHooks<CmsContentModelUpdateHookPluginArgs>("afterUpdate", args);
};
