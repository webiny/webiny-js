import DataLoader from "dataloader";
import { CmsContentEntry, CmsContext } from "../../../../types";
import * as utils from "../../../../utils";
import chunk from "lodash/chunk";

export const getAllEntryRevisions = (context: CmsContext, { PK_ENTRY }) => {
    return new DataLoader<string, CmsContentEntry[]>(async keys => {
        const results = [];

        for (let i = 0; i < keys.length; i++) {
            const [entries] = await context.db.read({
                ...utils.defaults.db(),
                query: {
                    PK: PK_ENTRY(keys[i]),
                    SK: { $beginsWith: "REV#" }
                }
            });

            results.push(entries);
        }

        return results;
    });
};

// Used in functions below. Ensures we are batch getting 100 keys at most.
const batchLoadKeys = loadChunk => {
    return new DataLoader<string, CmsContentEntry>(async keys => {
        // DynamoDB allows getting a maximum of 100 items in a single database call.
        // So, we are creating chunks that consist of a maximum of 100 keys.
        const keysChunks = chunk(keys, 100);
        const promises = [];

        keysChunks.forEach(chunk => {
            promises.push(new Promise(resolve => resolve(loadChunk(chunk))));
        });

        const entriesChunks = await Promise.all(promises);
        return entriesChunks.reduce((current, item) => current.concat(item), []);
    });
};

export const getRevisionById = (context: CmsContext, { PK_ENTRY }) => {
    return batchLoadKeys(keys => {
        const queries = keys.map(id => {
            const [entryId, version] = id.split("#");
            return {
                ...utils.defaults.db(),
                query: {
                    PK: PK_ENTRY(entryId),
                    SK: `REV#${version}`
                }
            };
        });

        return context.db
            .batch()
            .read(...queries)
            .execute()
            .then(results => results.map(result => result[0][0]));
    });
};

export const getPublishedRevisionByEntryId = (context: CmsContext, { PK_ENTRY, SK_PUBLISHED }) => {
    return batchLoadKeys(chunk =>
        context.db
            .batch()
            .read(
                ...chunk.map(id => ({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_ENTRY(id),
                        SK: SK_PUBLISHED()
                    }
                }))
            )
            .execute()
            .then(results => results.map(result => result[0][0]))
    );
};

export const getLatestRevisionByEntryId = (context: CmsContext, { PK_ENTRY, SK_LATEST }) => {
    return batchLoadKeys(chunk =>
        context.db
            .batch()
            .read(
                ...chunk.map(id => ({
                    ...utils.defaults.db(),
                    query: {
                        PK: PK_ENTRY(id),
                        SK: SK_LATEST()
                    }
                }))
            )
            .execute()
            .then(results => results.map(result => result[0][0]))
    );
};
