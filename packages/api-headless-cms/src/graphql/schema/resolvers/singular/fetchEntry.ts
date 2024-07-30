import { CmsContext, CmsEntry, CmsEntryValues, CmsModel } from "~/types";
import { WebinyError } from "@webiny/error";

interface IFetchEntriesParams {
    context: CmsContext;
    model: CmsModel;
}

export const fetchEntry = async <T extends CmsEntryValues = CmsEntryValues>(
    params: IFetchEntriesParams
): Promise<CmsEntry<T>> => {
    const { context, model } = params;
    const [items, meta] = await context.cms.listLatestEntries(model);
    if (meta.totalCount > 1) {
        throw new WebinyError({
            message: `More than one entry found for model "${model.modelId}". Please check your data.`,
            code: "SINGULAR_MODEL_MORE_THAN_ONE_ENTRY",
            data: {
                items: items.map(item => item.id)
            }
        });
    }
    let item = items[0];
    if (!item) {
        item = await context.cms.createEntry(model, {});
    }
    return item as CmsEntry<T>;
};
