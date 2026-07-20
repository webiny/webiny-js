import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";
import { FIELD_INDEXING_DEFAULT } from "../constants.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

class DefaultFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = FIELD_INDEXING_DEFAULT;
    public constructor(private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface) {}

    public toIndex({
        field,
        value
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        const fieldType = this.fieldRegistry.get(field.type);

        if (fieldType?.isSearchable === true) {
            return { value };
        }

        return { rawValue: value };
    }

    public fromIndex({ field, value, rawValue }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        const fieldType = this.fieldRegistry.get(field.type);
        const isSearchable = fieldType?.isSearchable ?? false;

        if (isSearchable) {
            return value === undefined ? rawValue : value;
        }
        return rawValue === undefined ? value : rawValue;
    }
}

export const DefaultFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: DefaultFieldIndexImpl,
    dependencies: [CmsModelFieldToGraphQLRegistry]
});
