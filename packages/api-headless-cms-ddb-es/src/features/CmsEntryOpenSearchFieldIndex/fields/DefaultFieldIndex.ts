import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

class DefaultFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "*";

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
