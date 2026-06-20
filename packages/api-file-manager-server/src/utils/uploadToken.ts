import { createHmac } from "node:crypto";
import type { UploadTokenPayload } from "~/types.js";

export const createUploadToken = (payload: UploadTokenPayload, secret: string): string => {
    const json = JSON.stringify(payload);
    const encoded = Buffer.from(json).toString("base64url");
    const signature = createHmac("sha256", secret)
        .update(encoded)
        .digest("base64url");

    return `${encoded}.${signature}`;
};

export const verifyUploadToken = (token: string, secret: string): UploadTokenPayload => {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) {
        throw new Error("Invalid token format.");
    }

    const encoded = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const expectedSignature = createHmac("sha256", secret)
        .update(encoded)
        .digest("base64url");

    if (signature !== expectedSignature) {
        throw new Error("Invalid token signature.");
    }

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as UploadTokenPayload;

    if (payload.expiresAt < Date.now()) {
        throw new Error("Token has expired.");
    }

    return payload;
};
