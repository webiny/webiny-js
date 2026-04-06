import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import type { CmsModel, CmsModelField, CmsModelFieldValidation } from "~/types";
import { ValidationFeature, CmsModelFieldValidatorRegistry } from "~/features/validation/index.js";

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
    const container = new Container();
    ValidationFeature.register(container);
    const registry = container.resolve(CmsModelFieldValidatorRegistry);
    const gteImpl = registry.get("dateGte")!;
    const lteImpl = registry.get("dateLte")!;

    const gteValidationDateCorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-06T16:30:50Z"],
        ["2020-06-06T16:30:50", "2020-06-06T16:30:50"],
        ["2020-06-06", "2020-06-05"]
    ];

    it.each(gteValidationDateCorrectValues)(
        "should pass gte validation - %s - %s",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue
            });

            const result = await gteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
            });
            expect(result).toEqual(true);
        }
    );

    const gteValidationDateIncorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-07T16:30:50Z"],
        ["2020-06-06T16:30:50", "2020-06-07T16:30:50"],
        ["2020-06-06", "2020-06-07"]
    ];

    it.each(gteValidationDateIncorrectValues)(
        "should not pass gte validation - %s - %s",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue
            });

            const result = await gteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
            });
            expect(result).toEqual(false);
        }
    );

    const lteValidationDateCorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-07T16:30:50Z"],
        ["2020-06-06T16:30:50", "2020-06-07T16:30:50"],
        ["2020-06-06", "2020-06-07"]
    ];

    it.each(lteValidationDateCorrectValues)(
        "name should pass lte validation - %s - %s",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue
            });

            const result = await lteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
            });
            expect(result).toEqual(true);
        }
    );

    const lteValidationDateIncorrectValues = [
        ["2020-06-06T16:30:50Z", "2020-06-06T16:30:49Z"],
        ["2020-06-06T16:30:50", "2020-06-06T16:30:49"],
        ["2020-06-06", "2020-06-05"]
    ];

    it.each(lteValidationDateIncorrectValues)(
        "name should not pass lte validation - %s - %s",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue
            });

            const result = await lteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
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
    it.each(timeValidationGteCorrectValues)(
        "gte - should pass validation when type is time - %s - %s",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue,
                type: "time"
            });

            const result = await gteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
            });
            expect(result).toEqual(true);
        }
    );

    const timeValidationGteIncorrectValues = [
        ["10:00:00", "10:00:01"],
        ["10:00", "10:00:01"],
        ["10:00:00", "10:01"]
    ];
    it.each(timeValidationGteIncorrectValues)(
        "gte - should fail validation when type is time - %s - %s",
        async (value, gteValue) => {
            const validator = createValidator({
                value: gteValue,
                type: "time"
            });

            const result = await gteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
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
    it.each(timeValidationLteCorrectValues)(
        "lte - should pass validation when type is time - %s - %s",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue,
                type: "time"
            });

            const result = await lteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
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
    it.each(timeValidationLteIncorrectValues)(
        "lte - should not pass validation when type is time - %s - %s",
        async (value, lteValue) => {
            const validator = createValidator({
                value: lteValue,
                type: "time"
            });

            const result = await lteImpl.validate({
                value,
                validator,
                context,
                field: {} as unknown as CmsModelField,
                model: {} as unknown as CmsModel
            });
            expect(result).toEqual(false);
        }
    );
});
