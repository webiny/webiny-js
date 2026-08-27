import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

class RichTextFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "rich-text";

    public toIndex({
        value
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        return {
            rawValue: value
        };
    }

    public fromIndex({ rawValue }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        return rawValue;
    }
}

export const RichTextFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: RichTextFieldIndexImpl,
    dependencies: []
});
