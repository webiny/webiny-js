import { validation } from "../src";

const gteValidationDateCorrectValues = [
    ["2020-06-06T16:30:50Z", "2020-06-06T16:30:50Z"],
    ["2020-06-06T16:30:50", "2020-06-06T16:30:50"],
    ["2020-06-06", "2020-06-05"]
];

const gteValidationDateIncorrectValues = [
    ["2020-06-06T16:30:50Z", "2020-06-07T16:30:50Z"],
    ["2020-06-06T16:30:50", "2020-06-07T16:30:50"],
    ["2020-06-06", "2020-06-07"]
];

describe("date gte test", () => {
    test.each(gteValidationDateCorrectValues)(
        "should validate to be true",
        async (date, gteValue) => {
            const result = await validation.validate(date, `dateGte:${gteValue}`);
            expect(result).toEqual(true);
        }
    );

    const emptyValues = [null, undefined, ""];
    test.each(emptyValues)(
        "should not get triggered if an empty value was set",
        async emptyValue => {
            const result = await validation.validate(null, `dateGte:${emptyValue}`);
            expect(result).toEqual(true);
        }
    );

    test.each(gteValidationDateIncorrectValues)(
        "should fail to validate",
        async (date, gteValue) => {
            const p = validation.validate(date, `dateGte:${gteValue}`);

            const gteDateValue = new Date(gteValue);

            await expect(p).rejects.toThrow(
                `Value needs to be greater than or equal to "${gteDateValue.toISOString()}".`
            );
        }
    );
});
