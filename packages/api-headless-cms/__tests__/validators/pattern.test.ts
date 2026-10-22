import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { CmsModelFieldValidator } from "~/features/validation/abstractions/CmsModelFieldValidator.js";
import { CmsModelFieldPatternValidatorRegistry } from "~/features/validation/abstractions/CmsModelFieldPatternValidatorRegistry.js";
import { PatternValidator } from "~/features/validation/validators/PatternValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

function createContainer() {
    const container = new Container();
    container.registerInstance(CmsModelFieldPatternValidatorRegistry, {
        get: () => undefined
    });
    container.register(PatternValidator);
    return container;
}

function createParams(
    value: unknown,
    settings: Record<string, unknown>
): CmsModelFieldValidatorValidateParams {
    return {
        value,
        validator: {
            name: "pattern",
            message: "Validation failed.",
            settings
        },
        field: {} as any,
        model: {} as any,
        entry: {} as any,
        context: {} as any
    };
}

describe("PatternValidator", () => {
    it("should validate with custom preset and null flags", async () => {
        const container = createContainer();
        const validator = container.resolve(CmsModelFieldValidator);

        const result = await validator.validate(
            createParams("test@example.com", {
                preset: "custom",
                regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                flags: null
            })
        );

        expect(result).toBe(true);
    });

    it("should reject invalid value with custom preset and null flags", async () => {
        const container = createContainer();
        const validator = container.resolve(CmsModelFieldValidator);

        const result = await validator.validate(
            createParams("not-an-email", {
                preset: "custom",
                regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                flags: null
            })
        );

        expect(result).toBe(false);
    });

    it("should validate with custom preset and undefined flags", async () => {
        const container = createContainer();
        const validator = container.resolve(CmsModelFieldValidator);

        const result = await validator.validate(
            createParams("test@example.com", {
                preset: "custom",
                regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                flags: undefined
            })
        );

        expect(result).toBe(true);
    });

    it("should validate with custom preset and empty string flags", async () => {
        const container = createContainer();
        const validator = container.resolve(CmsModelFieldValidator);

        const result = await validator.validate(
            createParams("TEST@EXAMPLE.COM", {
                preset: "custom",
                regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                flags: ""
            })
        );

        expect(result).toBe(true);
    });

    it("should validate with custom preset and valid flags", async () => {
        const container = createContainer();
        const validator = container.resolve(CmsModelFieldValidator);

        const result = await validator.validate(
            createParams("HELLO", {
                preset: "custom",
                regex: "^hello$",
                flags: "i"
            })
        );

        expect(result).toBe(true);
    });
});
