import { LexicalValue, NormalizedInputValue } from "~/types";

const isValueEmpty = (value: any) => {
    return [undefined, null, "", '""', "null"].includes(value);
};

/**
 * Value passed to the `RichTextEditor` component can be anything. This function normalizes some of the more common shapes
 * of input into a value that is either a `null` or a `LexicalValue`.
 */
export function normalizeInputValue(value: LexicalValue | null | undefined) {
    if (isValueEmpty(value)) {
        return null;
    }

    return value as NormalizedInputValue;
}
