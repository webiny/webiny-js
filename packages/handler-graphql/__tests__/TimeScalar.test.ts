import { TimeScalar } from "../src/builtInTypes";

describe("TimeScalar", () => {
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
