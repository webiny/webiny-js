import lodashIsEqual from "lodash/isEqual.js";
import type { CmsEntryValues } from "~/types/index.js";

/**
 * Removes object keys with `null` or `undefined` values, recursively, so that a field that was
 * never set and a field that is explicitly empty compare as equal.
 */
const withoutEmptyKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(withoutEmptyKeys);
    }
    if (value === null || typeof value !== "object" || value instanceof Date) {
        return value;
    }
    return Object.entries(value).reduce<Record<string, unknown>>((result, [key, item]) => {
        if (item !== null && item !== undefined) {
            result[key] = withoutEmptyKeys(item);
        }
        return result;
    }, {});
};

export interface IHasEntryContentChangedParams<TValues extends CmsEntryValues = CmsEntryValues> {
    /**
     * The values as they will be stored (normalized).
     */
    values: TValues;
    /**
     * The values to compare against, as currently stored.
     */
    baselineValues: TValues;
}

/**
 * Decides whether saving `values` changes the content of an entry. Used to keep the
 * saved/modified meta fields untouched when an entry is saved without actual changes, e.g. when
 * the "Save" button is clicked without editing anything.
 *
 * Only the content counts: moving an entry to another folder is not a content change, the same
 * as with the dedicated move operation.
 *
 * Values must already be normalized the same way as the stored ones (item IDs assigned, reference
 * fields mapped). A value that does not normalize identically is treated as a change, which only
 * means the meta fields get updated, exactly as they did before this check existed.
 */
export const hasEntryContentChanged = <TValues extends CmsEntryValues = CmsEntryValues>(
    params: IHasEntryContentChangedParams<TValues>
): boolean => {
    return !lodashIsEqual(withoutEmptyKeys(params.values), withoutEmptyKeys(params.baselineValues));
};
