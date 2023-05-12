import { DateTimeZScalar } from "~/builtInTypes";

describe("DateTimeZScalar", () => {
    test("should not change the input dateTime - it is correct", () => {
        const result = DateTimeZScalar.parseValue("2020-12-17T11:30:59+01:00");

        expect(result).toEqual("2020-12-17T11:30:59+01:00");
    });

    test("should not change the output dateTime - it is correct", () => {
        const result = DateTimeZScalar.serialize("2020-12-17T11:30:59+01:00");

        expect(result).toEqual("2020-12-17T11:30:59+01:00");
    });

    const badDateTimeList = [
        ["2020-12-17", "DateTime cannot represent an invalid date-time-string 2020-12-17"],
        [
            "2020-12-17T14:15:16",
            "DateTime cannot represent an invalid date-time-string 2020-12-17T14:15:16"
        ],
        ["2020-12-17T14:15:16Z", "Could not extract timezone from value."],
        [
            "2020-12-17T14:15:16+0100",
            "DateTime cannot represent an invalid date-time-string 2020-12-17T14:15:16+0100"
        ],
        [
            "2020-12-17T14:15:16+01.00",
            "DateTime cannot represent an invalid date-time-string 2020-12-17T14:15:16+01.00"
        ]
    ];

    test.each(badDateTimeList)("should throw an error on invalid dateTime", (dateTime, message) => {
        expect(() => {
            DateTimeZScalar.parseValue(dateTime);
        }).toThrow(message);
    });
});
