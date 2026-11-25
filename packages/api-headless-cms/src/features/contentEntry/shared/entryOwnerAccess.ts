import type { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";

/**
 * Entry-level (owner) access checks for entries loaded from storage.
 *
 * Model-level checks (`canAccessEntry({ model })`) cannot tell whether a user with
 * "own entries only" permission may see a specific entry, so every read use case must
 * run the loaded entries through these helpers as well.
 *
 * Singleton models are exempt: there is only one entry and it is shared by everyone
 * who can access the model.
 */
export const isSingletonModel = (model: Pick<CmsModel, "tags">): boolean => {
    return !!model.tags?.includes(CMS_MODEL_SINGLETON_TAG);
};

export const canAccessLoadedEntry = async (
    accessControl: AccessControl.Interface,
    model: CmsModel,
    entry: Pick<CmsEntry, "entryId" | "createdBy">
): Promise<boolean> => {
    if (isSingletonModel(model)) {
        return true;
    }
    return accessControl.canAccessEntry({ model, entry });
};

export const filterAccessibleEntries = async <T extends CmsEntryValues = CmsEntryValues>(
    accessControl: AccessControl.Interface,
    model: CmsModel,
    entries: CmsEntry<T>[]
): Promise<CmsEntry<T>[]> => {
    if (isSingletonModel(model)) {
        return entries;
    }
    const result: CmsEntry<T>[] = [];
    for (const entry of entries) {
        if (await accessControl.canAccessEntry({ model, entry })) {
            result.push(entry);
        }
    }
    return result;
};
