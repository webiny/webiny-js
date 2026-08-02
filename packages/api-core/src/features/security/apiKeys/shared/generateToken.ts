import crypto from "crypto";

/**
 * Generates a random token for API keys.
 * API Keys are prefixed with letter "wat_" to make token verification easier.
 * When authentication plugins kick in, they will be able to tell if they should handle
 * the token by checking the first letter.
 */
export const generateToken = (tokenLength = 40): string => {
    const token = crypto.randomBytes(Math.ceil(tokenLength / 2)).toString("hex");

    // API Keys are prefixed with letters "wat_" to make token verification easier
    if (token.startsWith("wat_")) {
        return token;
    }

    return `wat_${token.slice(0, tokenLength - 4)}`;
};
