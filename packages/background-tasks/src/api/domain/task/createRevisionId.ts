import { parseIdentifier } from "@webiny/utils";

// Tasks and logs are never revised, so every entry lives in its first revision.
export const createRevisionId = (id: string): string => {
    const { id: entryId } = parseIdentifier(id);
    return `${entryId}#0001`;
};
