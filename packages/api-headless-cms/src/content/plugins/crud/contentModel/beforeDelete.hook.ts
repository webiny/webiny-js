import {
    CmsContentModelHookPluginArgs,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsBeforeDeleteArgs,
    CmsContext
} from "../../../../types";
import WebinyError from "@webiny/error";
import { runContentModelLifecycleHooks } from "./runContentModelLifecycleHooks";

interface Args extends CmsContentModelStorageOperationsBeforeDeleteArgs {
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}

export const beforeDeleteHook = async (args: Args) => {
    const { context, model } = args;
    const { modelId } = model;
    const manager = await context.cms.getModel(modelId);
    let entries = [];
    try {
        [entries] = await manager.list({
            limit: 1
        });
    } catch (ex) {
        throw new WebinyError(
            "Could not retrieve a list of content entries from the model.",
            "ENTRIES_ERROR",
            {
                modelId,
                error: ex
            }
        );
    }
    if (entries.length > 0) {
        throw new WebinyError(
            `Cannot delete content model "${modelId}" because there are existing entries.`,
            "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED"
        );
    }
    if (args.storageOperations.beforeDelete) {
        await args.storageOperations.beforeDelete(args);
    }
    await runContentModelLifecycleHooks<CmsContentModelHookPluginArgs>("beforeDelete", args);
};
