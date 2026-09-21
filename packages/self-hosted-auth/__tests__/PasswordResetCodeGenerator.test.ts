import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import {
    PASSWORD_RESET_CODE_LENGTH,
    PasswordResetCodeGenerator,
    PasswordResetCodeGeneratorFeature
} from "~/api/domain/crypto/PasswordResetCodeGenerator.js";

const generator = () => {
    const container = new Container();
    PasswordResetCodeGeneratorFeature.register(container);

    return container.resolve(PasswordResetCodeGenerator);
};

describe("PasswordResetCodeGenerator", () => {
    it("produces a code of the expected length, every time", () => {
        const generate = generator();

        for (let attempt = 0; attempt < 500; attempt++) {
            expect(generate.generate()).toHaveLength(PASSWORD_RESET_CODE_LENGTH);
        }
    });

    it("produces digits only", () => {
        const generate = generator();

        for (let attempt = 0; attempt < 500; attempt++) {
            expect(generate.generate()).toMatch(/^[0-9]+$/);
        }
    });

    /**
     * Padding rather than shifting into range is what keeps 000042 a possible code. Dropping the
     * leading zeros would quietly cost a tenth of the space for every zero dropped, and the loss
     * would be invisible in every test that only checks the format.
     */
    it("keeps low numbers in the space by padding them", () => {
        const generate = generator();

        const codes = Array.from({ length: 5000 }, () => generate.generate());

        expect(codes.some(code => code.startsWith("0"))).toBe(true);
    });

    it("does not repeat itself", () => {
        const generate = generator();

        const codes = new Set(Array.from({ length: 200 }, () => generate.generate()));

        // Collisions are possible in a million-wide space, but 200 identical codes are not.
        expect(codes.size).toBeGreaterThan(150);
    });
});
