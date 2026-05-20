import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

class TextCompressedFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "text:compressed";

    public constructor(private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface) {}

    public toIndex(
        params: CmsEntryOpenSearchFieldIndex.ToIndex
    ): CmsEntryOpenSearchFieldIndex.ToValue {
        const { field, value } = params;
        const isSearchable = this.isSearchable(field);

        if (isSearchable) {
            return { value };
        }

        return {
            rawValue: value
        };
    }

    public fromIndex(params: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        const { field, value, rawValue } = params;
        const isSearchable = this.isSearchable(field);

        if (isSearchable) {
            return value === undefined ? rawValue : value;
        }
        return rawValue === undefined ? value : rawValue;
    }

    private isSearchable(field: CmsModelField): boolean {
        const fieldType = this.fieldRegistry.get(field.type);
        if (!fieldType?.isSearchable) {
            return false;
        } else if (field.settings?.disableFullTextSearch === true) {
            return false;
        }
        return true;
    }
}

export const TextCompressedFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: TextCompressedFieldIndexImpl,
    dependencies: [CmsModelFieldToGraphQLRegistry]
});
