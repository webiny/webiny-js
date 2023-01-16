import { TimeScalar } from "~/builtInTypes";

describe("TimeScalar", () => {
    const correctTime = [
        ["20:35", "20:35:00"],
        ["13:59", "13:59:00"],
        ["20:35:48", "20:35:48"],
        ["01:01:01", "01:01:01"]
    ];

    test.each(correctTime)("should parse the time", (time: string, expected: string) => {
        const result = TimeScalar.parseValue(time);

        expect(result).toEqual(expected);
    });
    const incorrectTime = [
        ["20", "Value does not look like time."],
        ["24:01:01", "There cannot be more than 24 hours."],
        ["-01:01:01", "Value does not look like time."],
        ["01:60:01", "There cannot be more than 59 minutes."],
        ["01:-01:01", "Value does not look like time."],
        ["01:01:60", "There cannot be more than 59 seconds."],
        ["01:01:-01", "Value does not look like time."]
    ];

    test.each(incorrectTime)("should not pass the validation", (time, message) => {
        expect(() => {
            TimeScalar.parseValue(time);
        }).toThrow(message);
    });
});
