import WebinyError from "@webiny/error";
import { CmsEntryOpenSearchFilterRegistry as Abstraction } from "./abstractions/CmsEntryOpenSearchFilterRegistry.js";
import { CmsEntryOpenSearchFilter } from "./abstractions/CmsEntryOpenSearchFilter.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { FILTER_DEFAULT } from "./constants.js";

class CmsEntryOpenSearchFilterRegistryImpl implements Abstraction.Interface {
    public constructor(private readonly filters: CmsEntryOpenSearchFilter.Interface[]) {}

    public get(type: string): CmsEntryOpenSearchFilter.Interface {
        const fieldType = getBaseFieldType({ type });
        const filter = this.filters.find(f => {
            return f.fieldType === fieldType;
        });
        if (filter) {
            return filter;
        }
        const fallback = this.filters.find(f => {
            return f.fieldType === FILTER_DEFAULT;
        });
        if (fallback) {
            return fallback;
        }
        throw new WebinyError(
            `There is no filter for the given field type "${fieldType}".`,
            "FILTER_REGISTRY_ERROR",
            {
                fieldType
            }
        );
    }
}

export const CmsEntryOpenSearchFilterRegistry = Abstraction.createImplementation({
    implementation: CmsEntryOpenSearchFilterRegistryImpl,
    dependencies: [[CmsEntryOpenSearchFilter, { multiple: true }]]
});
