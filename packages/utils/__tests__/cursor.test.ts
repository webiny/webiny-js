import { encodeCursor, decodeCursor, CursorInput, CursorOutput } from "~/cursor";

describe("Cursor", () => {
    const rawValues: [CursorInput, CursorOutput][] = [
        ["abcdef", "ImFiY2RlZiI="],
        ["1234", "IjEyMzQi"],
        [1234, "MTIzNA=="],
        [["somevalue", "somevalue2", 1234567], "WyJzb21ldmFsdWUiLCJzb21ldmFsdWUyIiwxMjM0NTY3XQ=="],
        [null, null],
        ["", null]
    ];

    it.each(rawValues)("should properly encode value", (input, output) => {
        const result = encodeCursor(input);

        expect(result).toEqual(output);
    });

    const encodedValues: [CursorOutput, CursorInput][] = [
        ["ImFiY2RlZiI=", "abcdef"],
        ["IjEyMzQi", "1234"],
        ["MTIzNA==", 1234],
        ["WyJzb21ldmFsdWUiLCJzb21ldmFsdWUyIiwxMjM0NTY3XQ==", ["somevalue", "somevalue2", 1234567]],
        [null, null]
    ];

    it.each(encodedValues)("should properly decode values", (input, output) => {
        const result = decodeCursor(input);

        expect(result).toEqual(output);
    });
});
