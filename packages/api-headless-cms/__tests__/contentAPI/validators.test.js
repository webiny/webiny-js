import { setupContext } from "@webiny/graphql/testing";
import validatorPlugins from "../src/content/plugins/validators";

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

    test("gte", async () => {
        const { validate } = getValidator("gte");
        const validator = {
            name: "gte",
            settings: {
                value: 3
            }
        };

        await expect(validate({ value: 5, validator, context })).resolves.toBe(true);
        await expect(validate({ value: 3, validator, context })).resolves.toBe(true);
        await expect(validate({ value: 2, validator, context })).resolves.toBe(false);
    });

    test("in", async () => {
        const { validate } = getValidator("in");
        const validator = {
            name: "in",
            settings: {
                values: [5, 6, 11, "abc"]
            }
        };
        await expect(validate({ value: 5, validator, context })).resolves.toBe(true);
        await expect(validate({ value: "abc", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "fhr", validator, context })).resolves.toBe(false);
        await expect(validate({ value: 2, validator, context })).resolves.toBe(false);
    });

    test("lte", async () => {
        const { validate } = getValidator("lte");
        const validator = {
            name: "lte",
            settings: {
                value: 5
            }
        };
        await expect(validate({ value: 3, validator, context })).resolves.toBe(true);
        await expect(validate({ value: 5, validator, context })).resolves.toBe(true);
        await expect(validate({ value: 7, validator, context })).resolves.toBe(false);
    });

    test("maxLength", async () => {
        const { validate } = getValidator("maxLength");
        const validator = {
            name: "maxLength",
            settings: {
                value: 5
            }
        };
        await expect(validate({ value: "abc", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "abcde", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "abcdef", validator, context })).resolves.toBe(false);
    });

    test("minLength", async () => {
        const { validate } = getValidator("minLength");
        const validator = {
            name: "minLength",
            settings: {
                value: 5
            }
        };
        await expect(validate({ value: "abcde", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "abcdef", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "abc", validator, context })).resolves.toBe(false);
    });

    test("required", async () => {
        const { validate } = getValidator("required");
        const validator = {
            name: "required"
        };
        await expect(validate({ value: "abcde", validator, context })).resolves.toBe(true);
        await expect(validate({ value: null, validator, context })).resolves.toBe(false);
        await expect(validate({ value: undefined, validator, context })).resolves.toBe(false);
    });

    test("pattern - email", async () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "email"
            }
        };

        await expect(validate({ value: "admin@webiny.com", validator, context })).resolves.toBe(
            true
        );
        await expect(validate({ value: "not-an-email", validator, context })).resolves.toBe(false);
    });

    test("pattern - lowerCase", async () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "lowerCase"
            }
        };

        await expect(validate({ value: "alllowercase", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "SomeCapitalLetters", validator, context })).resolves.toBe(
            false
        );
    });

    test("pattern - upperCase", async () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "upperCase"
            }
        };

        await expect(validate({ value: "ALLUPPERCASE", validator, context })).resolves.toBe(true);
        await expect(validate({ value: "SomeCapitalLetters", validator, context })).resolves.toBe(
            false
        );
    });

    test("pattern - URL", async () => {
        const { validate } = getValidator("pattern");
        const validator = {
            name: "pattern",
            settings: {
                preset: "url"
            }
        };

        await expect(
            validate({ value: "https://www.webiny.com", validator, context })
        ).resolves.toBe(true);
        await expect(validate({ value: "randomString.com", validator, context })).resolves.toBe(
            false
        );
        await expect(
            validate({ value: "www.missingprotocol.com", validator, context })
        ).resolves.toBe(false);
    });
});
