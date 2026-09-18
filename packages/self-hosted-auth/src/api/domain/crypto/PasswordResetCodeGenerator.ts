import { randomInt } from "node:crypto";
import { createAbstraction } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";

/** Digits in a generated code. Six, matching what Cognito sends, so the screens feel the same. */
export const PASSWORD_RESET_CODE_LENGTH = 6;

export interface IPasswordResetCodeGenerator {
    /** A fresh code, zero-padded to `PASSWORD_RESET_CODE_LENGTH` digits. */
    generate(): string;
}

/**
 * Mints the codes emailed to a user recovering their password. A seam of its own so that a test can
 * pin the code it is about to assert on, and so the format lives in one place if it ever grows past
 * six digits.
 */
export const PasswordResetCodeGenerator = createAbstraction<IPasswordResetCodeGenerator>(
    "PasswordResetCodeGenerator"
);

export namespace PasswordResetCodeGenerator {
    export type Interface = IPasswordResetCodeGenerator;
}

const UPPER_BOUND = 10 ** PASSWORD_RESET_CODE_LENGTH;

class RandomPasswordResetCodeGenerator implements IPasswordResetCodeGenerator {
    generate(): string {
        // `randomInt` and not `Math.random`: this is the only thing standing between a mailbox and
        // an account, so it has to come from the CSPRNG. It is also uniform over the range, which
        // `Math.random() * n | 0` is not quite.
        const value = randomInt(0, UPPER_BOUND);

        // Padded rather than shifted into range, so that 000042 is a code like any other. Dropping
        // leading zeros would quietly cost a tenth of the space for every zero dropped.
        return String(value).padStart(PASSWORD_RESET_CODE_LENGTH, "0");
    }
}

const randomPasswordResetCodeGenerator = PasswordResetCodeGenerator.createImplementation({
    implementation: RandomPasswordResetCodeGenerator,
    dependencies: []
});

export const PasswordResetCodeGeneratorFeature = createFeature({
    name: "PasswordResetCodeGenerator",
    register(container) {
        container.register(randomPasswordResetCodeGenerator);
    }
});
