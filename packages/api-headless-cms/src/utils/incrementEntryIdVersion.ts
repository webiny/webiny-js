import { createIdentifier, parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";

export const incrementEntryIdVersion = (id: string) => {
    const { id: entryId, version } = parseIdentifier(id);
    if (!version) {
        throw new WebinyError(
            "Cannot increase version on the ID without the version part.",
            "WRONG_ID",
            {
                id
            }
        );
    }
    return {
        entryId,
        version: version + 1,
        id: createIdentifier({
            id: entryId,
            version: version + 1
        })
    };
};
