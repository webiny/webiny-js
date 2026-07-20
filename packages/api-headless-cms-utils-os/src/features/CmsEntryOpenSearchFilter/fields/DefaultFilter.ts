import WebinyError from "@webiny/error";
import { CmsEntryOpenSearchFilter } from "../abstractions/CmsEntryOpenSearchFilter.js";
import { FILTER_DEFAULT } from "../constants.js";

class DefaultFilterImpl implements CmsEntryOpenSearchFilter.Interface {
    public readonly fieldType = FILTER_DEFAULT;

    public exec(params: CmsEntryOpenSearchFilter.ExecParams): void {
        const { applyFiltering, field } = params;
        if (!field.searchable) {
            const identifier = [...field.parents.map(p => p.fieldId), field.field.fieldId].join(
                "."
            );
            throw new WebinyError(`Field "${identifier}" is not searchable.`);
        }
        applyFiltering(params);
    }
}

export const DefaultFilter = CmsEntryOpenSearchFilter.createImplementation({
    implementation: DefaultFilterImpl,
    dependencies: []
});
