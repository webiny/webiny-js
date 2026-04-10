import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

const convertToString = (value: number[] | number) => {
    if (Array.isArray(value) === false) {
        return value;
    }
    return (value as number[]).map(String);
};

const convertToFloat = (value: string[] | number) => {
    if (Array.isArray(value) === false) {
        return typeof value === "string" ? parseFloat(value) : value;
    }
    return (value as string[]).map(v => parseFloat(v));
};

class NumberFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "number";

    public unmappedType(): string {
        return "float";
    }

    public toIndex({
        value
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        return {
            value: convertToString(value)
        };
    }

    public fromIndex({ value }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        return convertToFloat(value);
    }
}

export const NumberFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: NumberFieldIndexImpl,
    dependencies: []
});
