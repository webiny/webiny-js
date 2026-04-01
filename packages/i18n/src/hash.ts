import crypto from "node:crypto";

export const hash = (str: string): string => {
    return crypto.createHash("sha256").update(str).digest("hex").slice(0, 16);
};
