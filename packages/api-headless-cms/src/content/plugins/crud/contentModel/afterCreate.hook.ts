import {
    CmsContentModelCreateHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsAfterCreateArgs,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelStorageOperationsAfterCreateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}

export const afterCreateHook = async (args: Args): Promise<void> => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();
    if (args.storageOperations.afterCreate) {
        await args.storageOperations.afterCreate(args);
    }
    await runContentModelLifecycleHooks<CmsContentModelCreateHookPluginArgs>("afterCreate", args);
};
