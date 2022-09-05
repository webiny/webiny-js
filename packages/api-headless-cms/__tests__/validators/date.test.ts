import { createDateLteValidator } from "~/validators/dateLte";
import { createDateGteValidator } from "~/validators/dateGte";
import { CmsModelFieldValidation } from "~/types";

const createValidator = (args: Record<string, any>): CmsModelFieldValidation => {
    return {
        name: "test-validator",
        message: "test validation message",
        settings: {
            type: "date",
            ...args
        }
    };
};

describe("date validators", () => {
    const context: any = {};
    const gtePlugin = createDateGteValidator();
    const ltePlugin = createDateLteValidator();

    const gteValidationDateCorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-06T16:30:50Z"],
        ["2020-06-06T16:30:50", "2020-06-06T16:30:50"],
        ["2020-06-06", "2020-06-05"]
    ];

    test.each(gteValidationDateCorrectValues)(
        "should pass gte validation",
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
            expect(result).toEqual(true);
        }
    );

    const gteValidationDateIncorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-07T16:30:50Z"],
        ["2020-06-06T16:30:50", "2020-06-07T16:30:50"],
        ["2020-06-06", "2020-06-07"]
    ];

    test.each(gteValidationDateIncorrectValues)(
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

    const lteValidationDateCorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-07T16:30:50Z"],
        ["2020-06-06T16:30:50", "2020-06-07T16:30:50"],
        ["2020-06-06", "2020-06-07"]
    ];

    test.each(lteValidationDateCorrectValues)(
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

    const lteValidationDateIncorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-06T16:30:49Z"],
        ["2020-06-06T16:30:50", "2020-06-06T16:30:49"],
        ["2020-06-06", "2020-06-05"]
    ];

    test.each(lteValidationDateIncorrectValues)(
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

    const timeValidationGteCorrectValues = [
        ["10:00:00", "10:00:00"],
        ["10:00", "10:00:00"],
        ["10:00:01", "10:00:00"],
        ["10:00:01", "10:00"],
        ["10:00", "10:00"]
    ];
    test.each(timeValidationGteCorrectValues)(
        "gte - should pass validation when type is time",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue,
                type: "time"
            });

            const result = await gtePlugin.validator.validate({
                value,
                validator,
                context,
                field: {} as any,
                model: {} as any
            });
            expect(result).toEqual(true);
        }
    );

    const timeValidationGteIncorrectValues = [
        ["10:00:00", "10:00:01"],
        ["10:00", "10:00:01"],
        ["10:00:00", "10:01"]
    ];
    test.each(timeValidationGteIncorrectValues)(
        "gte - should fail validation when type is time",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue,
                type: "time"
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

    const timeValidationLteCorrectValues = [
        ["10:00:00", "10:00:01"],
        ["10:00", "10:00:01"],
        ["10:00:01", "10:01:00"],
        ["10:00:01", "10:01"],
        ["10:00", "10:00"]
    ];
    test.each(timeValidationLteCorrectValues)(
        "lte - should pass validation when type is time",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue,
                type: "time"
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

    const timeValidationLteIncorrectValues = [
        ["10:00:02", "10:00:01"],
        ["10:01", "10:00:01"],
        ["10:01:01", "10:01:00"],
        ["10:01:01", "10:01"],
        ["10:01", "10:00"]
    ];
    test.each(timeValidationLteIncorrectValues)(
        "lte - should not pass validation when type is time",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue,
                type: "time"
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
});
