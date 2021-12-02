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

export const parseIdentifier = (value?: string): ParseIdentifierResult => {
    if (!value) {
        throw new WebinyError("Missing value to be parsed for the identifier.", "MALFORMED_VALUE");
    }
    const [id, initialVersion] = value.split("#");
    if (!id) {
        throw new WebinyError("Missing ID in given value.", "MALFORMED_VALUE", {
            value
        });
    }
    const version = initialVersion ? Number(initialVersion) : null;
    if (version !== null && version <= 0) {
        throw new WebinyError(
            "Version parsed from ID is less or equal to zero.",
            "MALFORMED_VALUE",
            {
                id,
                version,
                value
            }
        );
    }
    return {
        id,
        version
    };
};
