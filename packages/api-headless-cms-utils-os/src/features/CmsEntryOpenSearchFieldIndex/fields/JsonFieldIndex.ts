import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

class JsonFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "json";

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

export const JsonFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: JsonFieldIndexImpl,
    dependencies: []
});
