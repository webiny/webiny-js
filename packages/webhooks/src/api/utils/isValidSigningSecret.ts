const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const SIGNING_SECRET_PREFIX = "whsec_";

export const INVALID_SIGNING_SECRET_MESSAGE = `A signing secret starting with "${SIGNING_SECRET_PREFIX}" must be followed by base64-encoded data.`;

/**
 * Plain-text secrets are base64-encoded before signing, so any value is valid. A "whsec_" secret is
 * passed to standardwebhooks as is, so the rest must be valid base64. An empty value is valid: it
 * means "no secret".
 */
export const isValidSigningSecret = (secret: string | undefined | null): boolean => {
    if (!secret || !secret.startsWith(SIGNING_SECRET_PREFIX)) {
        return true;
    }
    const encoded = secret.slice(SIGNING_SECRET_PREFIX.length);
    return encoded.length > 0 && encoded.length % 4 === 0 && BASE64.test(encoded);
};
