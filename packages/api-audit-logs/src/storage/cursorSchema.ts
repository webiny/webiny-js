import zod from "zod";
import { decodeCursor } from "@webiny/db-dynamodb";

const schema = zod
    .string()
    .transform(value => {
        const decoded = decodeCursor(value);
        if (!decoded) {
            throw new Error("Invalid cursor.");
        }
        try {
            return JSON.parse(decoded);
        } catch {
            return decoded;
        }
    })
    .pipe(
        zod.object({
            PK: zod.string(),
            SK: zod.string()
        })
    );

export const fetchCursor = (input: unknown) => {
    const result = schema.safeParse(input);
    if (!result.success) {
        return undefined;
    }
    return result.data;
};
