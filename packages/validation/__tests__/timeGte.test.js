import { validation } from "../src";

const gteValidationTimeCorrectValues = [
    ["02:34", "01:34"],
    ["02:34", "01:34"],
    ["12:34", "12:34"],
    ["12:34", "12:33"],
    ["23:34", "23:34"],
    ["23:34", "23:33"],
    ["02:34:13", "01:34"],
    ["02:34:17", "01:34:17"],
    ["12:34", "12:34:00"],
    ["12:34:00", "12:33"],
    ["23:34:02", "23:34:01"]
];

const gteValidationTimeIncorrectValues = [
    ["02:34", "03:35"],
    ["12:34", "12:35"],
    ["23:34", "23:35"],
    ["02:34:59", "03:35"],
    ["12:35:01", "12:59"]
];
describe("time gte test", () => {
    test.each(gteValidationTimeCorrectValues)(
        "should validate to be true",
        async (time, gteValue) => {
            const result = await validation.validate(time, `timeGte:${gteValue}`);
            expect(result).toEqual(true);
        }
    );

    it("should not get triggered if an empty value was set", async () => {
        const result = await validation.validate(null, "timeGte");
        expect(result).toEqual(true);
    });

    test.each(gteValidationTimeIncorrectValues)(
        "should fail to validate",
        async (time, gteValue) => {
            const p = validation.validate(time, `timeGte:${gteValue}`);

            await expect(p).rejects.toThrow(
                `Value needs to be greater than or equal to "${gteValue}".`
            );
        }
    );
});
