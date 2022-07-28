import { zeroPad } from "~/zeroPad";

describe("zero pad", () => {
    const inputs: [number | string, string][] = [
        [1, "0001"],
        [12, "0012"],
        [123, "0123"],
        ["1234", "1234"],
        [12345, "12345"]
    ];

    test.each(inputs)(`should pad "%s" with zeros`, (input, expected) => {
        const result = zeroPad(input);

        expect(result).toEqual(expected);
    });
});
