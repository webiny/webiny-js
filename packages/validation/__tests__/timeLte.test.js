import { validation } from "../src";

const lteValidationTimeCorrectValues = [
    ["02:34", "02:34"],
    ["02:34", "02:35"],
    ["12:34", "12:34"],
    ["12:34", "12:35"],
    ["23:34", "23:34"],
    ["23:34", "23:35"],
    ["02:34:00", "02:34:00"],
    ["02:34:59", "02:35:00"],
    ["12:34:17", "12:34:17"],
    ["12:34:01", "12:35:00"]
];

const lteValidationTimeIncorrectValues = [
    ["02:34", "01:35"],
    ["12:34", "11:35"],
    ["23:34", "22:35"],
    ["02:34:00", "01:35:00"],
    ["12:34:05", "11:35:08"],
    ["12:01:01", "12:01:00"],
    ["12:01:59", "12:01:58"]
];
describe("time lte test", () => {
    test.each(lteValidationTimeCorrectValues)(
        "should validate to be true",
        async (time, lteValue) => {
            const result = await validation.validate(time, `timeLte:${lteValue}`);
            expect(result).toEqual(true);
        }
    );

    const emptyValues = [null, undefined, ""];

    test.each(emptyValues)(
        "should not get triggered if an empty value was set",
        async emptyValue => {
            const result = await validation.validate(null, `timeLte:${emptyValue}`);
            expect(result).toEqual(true);
        }
    );

    test.each(lteValidationTimeIncorrectValues)(
        "should fail to validate",
        async (time, lteValue) => {
            const p = validation.validate(time, `timeLte:${lteValue}`);

            await expect(p).rejects.toThrow(
                `Value needs to be lesser than or equal to "${lteValue}".`
            );
        }
    );
});
