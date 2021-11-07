import {
    CmsContentModelCreateHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsAfterCreateParams,
    CmsContext
} from "../../../../types";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelStorageOperationsAfterCreateParams {
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
