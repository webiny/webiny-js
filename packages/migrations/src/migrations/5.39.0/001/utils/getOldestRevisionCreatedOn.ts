import { createDdbEntryEntity } from "./../entities/createEntryEntity";
import { CmsEntry } from "../types";
import { executeWithRetry, ExecuteWithRetryOptions } from "@webiny/utils";

const cachedEntryCreatedOn: Record<string, string> = {};

interface CmsEntryWithPK extends CmsEntry {
    PK: string;
}

export interface GetOldestRevisionCreatedOnParams {
    entry: CmsEntryWithPK;
    entryEntity: ReturnType<typeof createDdbEntryEntity>;
    retryOptions?: ExecuteWithRetryOptions;
}

export const getOldestRevisionCreatedOn = async (params: GetOldestRevisionCreatedOnParams) => {
    const { entry, entryEntity } = params;

    if (cachedEntryCreatedOn[entry.PK]) {
        return cachedEntryCreatedOn[entry.PK];
    }

    if (entry.version === 1) {
        cachedEntryCreatedOn[entry.PK] = entry.createdOn;
    } else {
        const executeQuery = () => {
            return entryEntity.query(entry.PK, {
                limit: 1,
                beginsWith: "REV#",
                attributes: ["createdOn"]
            });
        };

        const result = await executeWithRetry(executeQuery, params.retryOptions);

        const oldestRevision = result.Items?.[0];
        if (oldestRevision) {
            cachedEntryCreatedOn[entry.PK] = oldestRevision.createdOn;
        }
    }

    return cachedEntryCreatedOn[entry.PK];
};
