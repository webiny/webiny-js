import dateLtePlugin from "../../src/content/plugins/validators/dateLte";
import dateGtePlugin from "../../src/content/plugins/validators/dateGte";
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

describe("date validators", () => {
    const context: any = {};
    const gtePlugin = dateGtePlugin();
    const ltePlugin = dateLtePlugin();

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
                context
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
                context
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
                context
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
                context
            });
            expect(result).toEqual(false);
        }
    );
});
