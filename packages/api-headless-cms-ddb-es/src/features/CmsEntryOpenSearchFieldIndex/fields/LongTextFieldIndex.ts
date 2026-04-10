import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

class LongTextFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "long-text";

    public toIndex({
        rawValue
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        return {
            value: Array.isArray(rawValue) ? rawValue : rawValue || ""
        };
    }

    public fromIndex({ value }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        if (Array.isArray(value)) {
            return value;
        }
        return value || "";
    }
}

export const LongTextFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: LongTextFieldIndexImpl,
    dependencies: []
});
