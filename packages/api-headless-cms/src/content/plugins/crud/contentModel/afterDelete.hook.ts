import {
    CmsContentModelHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsAfterDeleteArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelStorageOperationsAfterDeleteArgs {
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}
export const afterDeleteHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();

    if (args.storageOperations.afterDelete) {
        await args.storageOperations.afterDelete(args);
    }
    await runContentModelLifecycleHooks<CmsContentModelHookPluginArgs>("afterDelete", args);
};
