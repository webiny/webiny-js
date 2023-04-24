import { CmsAcoContext } from "~/types";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle";
import { getEntryDescription } from "@webiny/api-headless-cms/utils/getEntryDescription";
import {
    CmsEntryAcoModifyUpdatePayloadPlugin,
    CmsEntryAcoModifyUpdatePayloadPluginPayload
} from "~/plugins/CmsEntryAcoModifyUpdatePayloadPlugin";
import { getEntryImage } from "@webiny/api-headless-cms/utils/getEntryImage";

interface Params {
    context: CmsAcoContext;
    model: CmsModel;
    entry: CmsEntry;
}

export const updateHeadlessCmsRecordPayload = async (
    params: Params
): Promise<CmsEntryAcoModifyUpdatePayloadPluginPayload> => {
    const { context, model, entry } = params;
    const title = getEntryTitle(model, entry);
    const description = getEntryDescription(model, entry);
    const image = getEntryImage(model, entry);

    const payload: CmsEntryAcoModifyUpdatePayloadPluginPayload = {
        title,
        content: description,
        tags: [`model:${model.modelId}`],
        data: {
            image,
            createdBy: entry.createdBy,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            status: entry.status,
            version: entry.version,
            locked: entry.locked
        }
    };
    const plugins = context.plugins.byType<CmsEntryAcoModifyUpdatePayloadPlugin>(
        CmsEntryAcoModifyUpdatePayloadPlugin.type
    );
    for (const plugin of plugins) {
        await plugin.modifyPayload({
            plugins: context.plugins,
            payload,
            model,
            entry
        });
    }

    return payload;
};
