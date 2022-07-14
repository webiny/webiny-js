import { createTimeLteValidator } from "~/validators/timeLte";
import { createTimeGteValidator } from "~/validators/timeGte";
import { CmsModelFieldValidation } from "~/types";

const createValidator = (args: Record<string, any>): CmsModelFieldValidation => {
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
    const gtePlugin = createTimeGteValidator();
    const ltePlugin = createTimeLteValidator();

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
            context,
            field: {} as any,
            model: {} as any
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
                context,
                field: {} as any,
                model: {} as any
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
                context,
                field: {} as any,
                model: {} as any
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
                context,
                field: {} as any,
                model: {} as any
            });
            expect(result).toEqual(false);
        }
    );

    const rangeValidationCorrectValues = [
        ["11:22:33", "10:00:00", "22:00:00"],
        ["10:00:00", "10:00:00", "22:00:00"],
        ["22:00:00", "10:00:00", "22:00:00"]
    ];

    const validate = async ({ value, lteValidator, gteValidator }: any) => {
        const lteValid = await ltePlugin.validator.validate({
            value,
            validator: lteValidator,
            context,
            field: {} as any,
            model: {} as any
        });
        const gteValid = await gtePlugin.validator.validate({
            value,
            validator: gteValidator,
            context,
            field: {} as any,
            model: {} as any
        });
        return lteValid && gteValid;
    };

    test.each(rangeValidationCorrectValues)(
        "time should pass validation for being in given range",
        async (value, gte, lte) => {
            const lteValidator = createValidator({
                value: lte
            });
            const gteValidator = createValidator({
                value: gte
            });

            const result = await validate({
                value,
                lteValidator,
                gteValidator
            });

            expect(result).toEqual(true);
        }
    );
    const rangeValidationIncorrectValues = [
        ["11:22:33", "12:00:00", "22:00:00"],
        ["22:00:00", "10:00:00", "21:00:00"]
    ];

    test.each(rangeValidationIncorrectValues)(
        "time should not pass validation because it is not in range",
        async (value, gte, lte) => {
            const lteValidator = createValidator({
                value: lte
            });
            const gteValidator = createValidator({
                value: gte
            });

            const result = await validate({
                value,
                lteValidator,
                gteValidator
            });

            expect(result).toEqual(false);
        }
    );
});
