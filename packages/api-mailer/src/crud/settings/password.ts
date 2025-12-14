import CryptoJS from "crypto-js";
import WebinyError from "@webiny/error";
import { DecryptionError, EncryptionError } from "~/errors.js";

interface Params {
    value?: string | null;
    secret?: string | null;
}

const MIN_SECRET_LENGTH = 16;

/**
 * Validates that the secret meets minimum security requirements.
 * @throws {WebinyError} If secret is missing or too short
 */
const validateSecret = (secret: string | null | undefined, operation: string): void => {
    if (!secret) {
        throw new WebinyError(
            `Cannot call ${operation} without passing the secret.`,
            "MISSING_SECRET",
            {
                operation
            }
        );
    }
    if (secret.length < MIN_SECRET_LENGTH) {
        throw new WebinyError(
            `Secret must be at least ${MIN_SECRET_LENGTH} characters long.`,
            "WEAK_SECRET",
            {
                operation,
                minLength: MIN_SECRET_LENGTH,
                actualLength: secret.length
            }
        );
    }
};

/**
 * Decrypts an encrypted password using AES encryption.
 *
 * @param params - Decryption parameters
 * @param params.value - The encrypted password string to decrypt
 * @param params.secret - The secret key used for decryption
 * @returns The decrypted password string, or empty string if value is null/undefined
 * @throws {WebinyError} If secret is missing or invalid
 * @throws {DecryptionError} If decryption fails
 *
 * @example
 * const decrypted = decrypt({
 *   value: "U2FsdGVkX1...",
 *   secret: "my-secret-key"
 * });
 */
export const decrypt = (params: Params): string => {
    const { value, secret } = params;

    validateSecret(secret, "decrypt");

    if (!value) {
        return "";
    }

    try {
        const bytes = CryptoJS.AES.decrypt(value, secret!);
        const result = bytes.toString(CryptoJS.enc.Utf8);

        if (!result) {
            throw new DecryptionError(
                "Decryption produced empty result. This may indicate incorrect secret or corrupted data."
            );
        }

        return result;
    } catch (error) {
        if (error instanceof DecryptionError) {
            throw error;
        }
        throw new DecryptionError(
            "Failed to decrypt password. The encrypted value may be corrupted or the secret may be incorrect.",
            error instanceof Error ? error : undefined
        );
    }
};

/**
 * Encrypts a password using AES encryption.
 *
 * @param params - Encryption parameters
 * @param params.value - The plain text password to encrypt
 * @param params.secret - The secret key used for encryption
 * @returns The encrypted password string, or empty string if value is null/undefined
 * @throws {WebinyError} If secret is missing or invalid
 * @throws {EncryptionError} If encryption fails
 *
 * @example
 * const encrypted = encrypt({
 *   value: "my-password",
 *   secret: "my-secret-key"
 * });
 */
export const encrypt = (params: Params): string => {
    const { value, secret } = params;

    validateSecret(secret, "encrypt");

    if (!value) {
        return "";
    }

    try {
        return CryptoJS.AES.encrypt(value, secret!).toString();
    } catch (error) {
        throw new EncryptionError(
            "Failed to encrypt password.",
            error instanceof Error ? error : undefined
        );
    }
};
