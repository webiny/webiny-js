import { parseIdentifier } from "@webiny/utils";

const WBY_LM_PREFIX = "wby-lm-";

export const createLockRecordDatabaseId = (input: string): string => {
    const { id } = parseIdentifier(input);
    if (id.startsWith(WBY_LM_PREFIX)) {
        return id;
    }
    return `${WBY_LM_PREFIX}${id}`;
};

export const removeLockRecordDatabasePrefix = (id: string) => {
    return id.replace(WBY_LM_PREFIX, "");
};
