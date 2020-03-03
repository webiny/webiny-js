import { setupContext } from "@webiny/api/testing";
import validatorPlugins from "../src/plugins/validators";

describe("Headless CMS - Field validators", () => {
    let context;

    beforeAll(async () => {
        // Setup context
        context = await setupContext(validatorPlugins);
    });

    function getValidator(name) {
        return context.plugins
            .byType("cms-model-field-validator")
            .find(pl => pl.validator.name === name).validator;
    }

    test("gte", () => {
        const { validate } = getValidator("gte");
        const validator = {
            name: "gte",
            settings: {
                value: 3
            }
        };

        expect(validate({ value: 5, validator, context })).resolves.toBe(true);
        expect(validate({ value: 3, validator, context })).resolves.toBe(true);
        expect(validate({ value: 2, validator, context })).resolves.toBe(false);
    });

    test("in", () => {
        const { validate } = getValidator("in");
        const validator = {
            name: "in",
            settings: {
                values: [5, 6, 11, "abc"]
            }
        };
        expect(validate({ value: 5, validator, context })).resolves.toBe(true);
        expect(validate({ value: "abc", validator, context })).resolves.toBe(true);
        expect(validate({ value: "fhr", validator, context })).resolves.toBe(false);
        expect(validate({ value: 2, validator, context })).resolves.toBe(false);
    });

    test("lte", () => {
        const { validate } = getValidator("lte");
        const validator = {
            name: "lte",
            settings: {
                value: 5
            }
        };
        expect(validate({ value: 3, validator, context })).resolves.toBe(true);
        expect(validate({ value: 5, validator, context })).resolves.toBe(true);
        expect(validate({ value: 7, validator, context })).resolves.toBe(false);
    });

    test("maxLength", () => {
        const { validate } = getValidator("maxLength");
        const validator = {
            name: "maxLength",
            settings: {
                value: 5
            }
        };
        expect(validate({ value: "abc", validator, context })).resolves.toBe(true);
        expect(validate({ value: "abcde", validator, context })).resolves.toBe(true);
        expect(validate({ value: "abcdef", validator, context })).resolves.toBe(false);
    });

    test("minLength", () => {
        const { validate } = getValidator("minLength");
        const validator = {
            name: "minLength",
            settings: {
                value: 5
            }
        };
        expect(validate({ value: "abcde", validator, context })).resolves.toBe(true);
        expect(validate({ value: "abcdef", validator, context })).resolves.toBe(true);
        expect(validate({ value: "abc", validator, context })).resolves.toBe(false);
    });

    test("required", () => {
        const { validate } = getValidator("required");
        const validator = {
            name: "required"
        };
        expect(validate({ value: "abcde", validator, context })).resolves.toBe(true);
        expect(validate({ value: null, validator, context })).resolves.toBe(false);
        expect(validate({ value: undefined, validator, context })).resolves.toBe(false);
    });

    test("pattern - email", () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "email"
            }
        };

        expect(validate({ value: "admin@webiny.com", validator, context })).resolves.toBe(true);
        expect(validate({ value: "not-an-email", validator, context })).resolves.toBe(false);
    });

    test("pattern - lowerCase", () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "lowerCase"
            }
        };

        expect(validate({ value: "alllowercase", validator, context })).resolves.toBe(true);
        expect(validate({ value: "SomeCapitalLetters", validator, context })).resolves.toBe(false);
    });

    test("pattern - upperCase", () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "upperCase"
            }
        };

        expect(validate({ value: "ALLUPPERCASE", validator, context })).resolves.toBe(true);
        expect(validate({ value: "SomeCapitalLetters", validator, context })).resolves.toBe(false);
    });

    test("pattern - URL", () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "url"
            }
        };

        expect(validate({ value: "https://www.webiny.com", validator, context })).resolves.toBe(true);
        expect(validate({ value: "randomString.com", validator, context })).resolves.toBe(false);
        expect(validate({ value: "www.missingprotocol.com", validator, context })).resolves.toBe(false);
    });
});
