import {
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsBeforeUpdateArgs,
    CmsContext
} from "../../../../types";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";

interface Args extends CmsContentModelGroupStorageOperationsBeforeUpdateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelGroupStorageOperations;
}
export const beforeUpdateHook = async ({
    input,
    group,
    data,
    context,
    storageOperations
}: Args): Promise<void> => {
    const groupPlugin: ContentModelGroupPlugin = context.plugins
        .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
        .find((item: ContentModelGroupPlugin) => item.contentModelGroup.slug === input.slug);

    if (groupPlugin) {
        throw new Error(`Content model groups defined via plugins cannot be updated.`);
    }

    if (!storageOperations.beforeUpdate) {
        return;
    }
    await storageOperations.beforeUpdate({
        data,
        group,
        input
    });
};
