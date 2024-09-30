import { createDdbEntryEntity } from "./../entities/createEntryEntity";
import { CmsEntry } from "../types";
import { executeWithRetry, ExecuteWithRetryOptions } from "@webiny/utils";

const cachedEntryFirstLastPublishedOnBy: Record<
    string,
    Pick<CmsEntry, "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy">
> = {};

interface CmsEntryWithPK extends CmsEntry {
    PK: string;
}

export interface getFirstLastPublishedOnParams {
    entry: CmsEntryWithPK;
    entryEntity: ReturnType<typeof createDdbEntryEntity>;
    retryOptions?: ExecuteWithRetryOptions;
}

export const getFirstLastPublishedOnBy = async (params: getFirstLastPublishedOnParams) => {
    const { entry, entryEntity } = params;

    if (cachedEntryFirstLastPublishedOnBy[entry.PK]) {
        return cachedEntryFirstLastPublishedOnBy[entry.PK];
    }

    cachedEntryFirstLastPublishedOnBy[entry.PK] = {
        firstPublishedOn: null,
        lastPublishedOn: null,
        firstPublishedBy: null,
        lastPublishedBy: null
    };

    const executeQuery = () => {
        return entryEntity.query(entry.PK, {
            limit: 1,
            eq: "P",
            attributes: ["modifiedBy", "createdBy", "publishedOn"]
        });
    };

    const result = await executeWithRetry(executeQuery, params.retryOptions);

    const publishedRecord = result.Items?.[0];
    if (publishedRecord) {
        cachedEntryFirstLastPublishedOnBy[entry.PK] = {
            firstPublishedOn: publishedRecord.publishedOn || null,
            lastPublishedOn: publishedRecord.publishedOn || null,
            firstPublishedBy: entry.modifiedBy || entry.createdBy || null,
            lastPublishedBy: entry.modifiedBy || entry.createdBy || null
        };
    }

    return cachedEntryFirstLastPublishedOnBy[entry.PK];
};
