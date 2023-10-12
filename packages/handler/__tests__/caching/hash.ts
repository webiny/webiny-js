import crypto from "crypto";

export const hash = (input: any): string => {
    const value = typeof input === "object" && input ? JSON.stringify(input) : String(input);
    return crypto.createHash("sha256").update(value).digest("hex");
};
