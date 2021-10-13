/**
 * When you want to extract the generated ID and version out of the identifier string.
 * In case there is no version, it's not a problem, possibly only generated ID was sent.
 * It does not cause an error. Write check for that in the code using this fn.
 */
import WebinyError from "@webiny/error";

export interface ParseIdentifierResult {
    id: string;
    version: number | null;
}

export const parseIdentifier = (value: string): ParseIdentifierResult => {
    const [id, version] = value.split("#");
    if (!id) {
        throw new WebinyError("Missing ID in given value.", "MALFORMED_VALUE", {
            value
        });
    }
    return {
        id,
        version: version ? Number(version) : null
    };
};
