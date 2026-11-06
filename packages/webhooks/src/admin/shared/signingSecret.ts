import { SIGNING_SECRET_PREFIX } from "~/api/utils/isValidSigningSecret.js";

export {
    isValidSigningSecret,
    INVALID_SIGNING_SECRET_MESSAGE
} from "~/api/utils/isValidSigningSecret.js";

/* A random 32-byte secret in the standard-webhooks format ("whsec_" + base64). */
export const generateSigningSecret = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return `${SIGNING_SECRET_PREFIX}${btoa(String.fromCharCode(...bytes))}`;
};
