import timeLtePlugin from "../../src/content/plugins/validators/timeLte";
import timeGtePlugin from "../../src/content/plugins/validators/timeGte";
import { CmsContentModelFieldValidation } from "@webiny/api-headless-cms/types";

const createValidator = (args): CmsContentModelFieldValidation => {
    return {
        name: "test-validator",
        message: "test validation message",
        settings: {
            ...args
        }
    };
};

describe("time validators", () => {
    const context: any = {};
    const gtePlugin = timeGtePlugin();
    const ltePlugin = timeLtePlugin();

    const gteValidationCorrectValues = [
        ["11:22:33", "11:22:33"],
        ["11:22:34", "11:22:33"],
        ["11:23:33", "11:22:33"],
        ["12:22:33", "11:22:33"],
        ["11:22", "11:21:59"],
        ["11:22:33", "11:22"],
        ["11:23", "11:22"]
    ];

    test.each(gteValidationCorrectValues)("should pass gte validation", async (value, gteValue) => {
        const validator = createValidator({
            value: gteValue
        });

        const result = await gtePlugin.validator.validate({
            value,
            validator,
            context
        });
        expect(result).toEqual(true);
    });

    const gteValidationIncorrectValues = [
        ["11:22:33", "11:22:34"],
        ["11:22:33", "11:23:33"],
        ["11:22:33", "12:22:33"],
        ["11:22", "11:22:33"],
        ["11:22", "11:22:01"]
    ];

    test.each(gteValidationIncorrectValues)(
        "should not pass gte validation",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue
            });

            const result = await gtePlugin.validator.validate({
                value,
                validator,
                context
            });
            expect(result).toEqual(false);
        }
    );

    const lteValidationCorrectValues = [
        ["11:22:33", "11:22:33"],
        ["11:22:33", "11:22:34"],
        ["11:22:33", "11:23:33"],
        ["11:22:33", "12:22:33"],
        ["11:21:59", "12:22"],
        ["11:22:33", "12:23"]
    ];

    test.each(lteValidationCorrectValues)(
        "name should pass lte validation",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue
            });

            const result = await ltePlugin.validator.validate({
                value,
                validator,
                context
            });
            expect(result).toEqual(true);
        }
    );

    const lteValidationIncorrectValues = [
        ["11:22:33", "11:22:32"],
        ["11:22:33", "11:21:33"],
        ["11:22:33", "11:22"],
        ["11:23", "11:22:33"]
    ];

    test.each(lteValidationIncorrectValues)(
        "name should not pass lte validation",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue
            });

            const result = await ltePlugin.validator.validate({
                value,
                validator,
                context
            });
            expect(result).toEqual(false);
        }
    );
});
