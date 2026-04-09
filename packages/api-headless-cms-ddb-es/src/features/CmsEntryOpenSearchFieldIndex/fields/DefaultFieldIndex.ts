import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";
import { FIELD_INDEXING_DEFAULT } from "../constants.js";

class DefaultFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = FIELD_INDEXING_DEFAULT;

    public toIndex({
        field,
        fieldRegistry,
        value
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        const fieldType = fieldRegistry.get(field.type);

        if (fieldType?.isSearchable === true) {
            return { value };
        }

        return { rawValue: value };
    }

    public fromIndex({
        field,
        fieldRegistry,
        value,
        rawValue
    }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        const fieldType = fieldRegistry.get(field.type);
        const isSearchable = fieldType?.isSearchable ?? false;

        if (isSearchable) {
            return value === undefined ? rawValue : value;
        }
        return rawValue === undefined ? value : rawValue;
    }
}

export const DefaultFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: DefaultFieldIndexImpl,
    dependencies: []
});
