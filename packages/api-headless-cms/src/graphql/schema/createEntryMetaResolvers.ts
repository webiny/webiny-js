import type { CmsContext, CmsEntry, CmsModel } from "~/types/index.js";
import { getEntryTitle } from "~/utils/getEntryTitle.js";
import { getEntryImage } from "~/utils/getEntryImage.js";
import { entryFieldFromStorageTransform } from "~/utils/entryStorage.js";

interface EntryMetaRevisionsResolver {
    (entry: Pick<CmsEntry, "entryId">, args: unknown, context: CmsContext): Promise<CmsEntry[]>;
}

interface CreateEntryMetaResolversParams {
    model: CmsModel;
    revisions: EntryMetaRevisionsResolver;
}

/**
 * Resolvers for the `<Model>Meta` type, shared by the regular manage and the singleton manage schema.
 */
export const createEntryMetaResolvers = ({ model, revisions }: CreateEntryMetaResolversParams) => {
    return {
        title(entry: Pick<CmsEntry, "id" | "values">) {
            return getEntryTitle(model, entry);
        },
        description: (entry: Pick<CmsEntry, "values">, _: unknown, context: CmsContext) => {
            if (!model.descriptionFieldId) {
                return "";
            }
            const field = model.fields.find(f => f.fieldId === model.descriptionFieldId);
            if (!field) {
                return "";
            }

            return entryFieldFromStorageTransform({
                context,
                model,
                field,
                value: entry.values[field.fieldId as keyof CmsEntry["values"]]
            });
        },
        image: (entry: Pick<CmsEntry, "values">) => {
            return getEntryImage(model, entry);
        },
        status(entry: Pick<CmsEntry, "status">) {
            return entry.status;
        },
        revisions
    };
};
