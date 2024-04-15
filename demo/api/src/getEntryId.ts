import { parseIdentifier } from "@webiny/utils";

export const getEntryId = (id: string) => {
    const { id: entryId } = parseIdentifier(id);
    return entryId;
};
