import { NumberScalar } from "~/builtInTypes";

describe("NumberScalar", () => {
    const correctInputValues = [
        [1, 1],
        [103232, 103232],
        [50932.123, 50932.123],
        [95032493.001, 95032493.001],
        ["1234", 1234],
        ["9832.110", 9832.11],
        ["0.00001", 0.00001]
    ];
    test.each(correctInputValues)(
        "it should parse number correctly - %s -> %s",
        (value, expected) => {
            const result = NumberScalar.parseValue(value);
            expect(result).toEqual(expected);
        }
    );

    const incorrectInputValues = [
        ["fdlms", "Value sent must be a number."],
        ["hf91nhfd", "Value sent must be a number."],
        ["0x005", "Value sent must be a non-hex number."]
    ];

    test.each(incorrectInputValues)(
        "it should throw an error on incorrect value - %s -> %s",
        (value: any, message: string) => {
            expect(() => {
                NumberScalar.parseValue(value);
            }).toThrow(message);
        }
    );
    const correctOutputValues = [
        [1, 1],
        [103232, 103232],
        [50932.123, 50932.123],
        [95032493.001, 95032493.001],
        ["1234", 1234],
        ["9832.110", 9832.11],
        ["0.00001", 0.00001]
    ];
    test.each(correctOutputValues)(
        "should serialize number correctly - %s -> %s",
        (value, expected) => {
            const result = NumberScalar.serialize(value);
            expect(result).toEqual(expected);
        }
    );

    const incorrectOutputValues = [["fdlms"], ["hf91nhfd"], ["0x005"]];

    test.each(incorrectOutputValues)(
        "should return null on incorrect value - %s -> %s",
        (value: any) => {
            const result = NumberScalar.serialize(value);
            expect(result).toEqual(null);
        }
    );
});
