import { validation } from "../src";

const lteValidationDateCorrectValues = [
    ["2020-06-06T16:30:50Z", "2020-06-07T16:30:50Z"],
    ["2020-06-06T16:30:50", "2020-06-07T16:30:50"],
    ["2020-06-06", "2020-06-07"]
];

const lteValidationDateIncorrectValues = [
    ["2020-06-06T16:30:50Z", "2020-06-06T16:30:49Z"],
    ["2020-06-06T16:30:50", "2020-06-06T16:30:49"],
    ["2020-06-06", "2020-06-05"]
];

describe("date lte test", () => {
    test.each(lteValidationDateCorrectValues)(
        "should validate to be true",
        async (date, lteValue) => {
            const result = await validation.validate(date, `dateLte:${lteValue}`);
            expect(result).toEqual(true);
        }
    );

    const emptyValues = [null, undefined, ""];

    test.each(emptyValues)(
        "should not get triggered if an empty value was set",
        async emptyValue => {
            const result = await validation.validate(null, `dateLte:${emptyValue}`);
            expect(result).toEqual(true);
        }
    );

    test.each(lteValidationDateIncorrectValues)(
        "should fail to validate",
        async (date, lteValue) => {
            const p = validation.validate(date, `dateLte:${lteValue}`);

            const lteDateValue = new Date(lteValue);

            await expect(p).rejects.toThrow(
                `Value needs to be lesser than or equal to "${lteDateValue.toISOString()}".`
            );
        }
    );
});
