import DataLoader from "dataloader";
import { CmsContentEntryType, CmsContext } from "@webiny/api-headless-cms/types";
import * as utils from "../../../../utils";

export const getAllEntryRevisions = (context: CmsContext, { PK_ENTRY }) => {
    return new DataLoader<string, CmsContentEntryType[]>(async keys => {
        const results = [];

        for (let i = 0; i < keys.length; i++) {
            const [entries] = await context.db.read({
                ...utils.defaults.db,
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

export const getRevisionById = (context: CmsContext, { PK_ENTRY }) => {
    return new DataLoader<string, CmsContentEntryType>(async keys => {
        const queries = keys.map(id => {
            const [entryId, version] = id.split("#");
            return {
                ...utils.defaults.db,
                query: {
                    PK: PK_ENTRY(entryId),
                    SK: `REV#${version}`
                }
            };
        });

        const results = (await context.db
            .batch()
            .read(...queries)
            .execute()) as [CmsContentEntryType[]][];

        // We're not filtering empty values here as we must return the same amount of items as the number of "keys".
        const items = results.map(result => {
            const items = result[0];

            return items[0];
        });

        return items;
    });
};

export const getPublishedRevisionByEntryId = (context: CmsContext, { PK_ENTRY, SK_PUBLISHED }) => {
    return new DataLoader<string, CmsContentEntryType>(async keys => {
        const entries = await context.db
            .batch()
            .read(
                ...keys.map(id => ({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_ENTRY(id),
                        SK: SK_PUBLISHED()
                    }
                }))
            )
            .execute();

        return entries.map(result => result[0][0]);
    });
};

export const getLatestRevisionByEntryId = (context: CmsContext, { PK_ENTRY, SK_LATEST }) => {
    return new DataLoader<string, CmsContentEntryType>(async keys => {
        const entries = await context.db
            .batch()
            .read(
                ...keys.map(id => ({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_ENTRY(id),
                        SK: SK_LATEST()
                    }
                }))
            )
            .execute();

        return entries.map(result => result[0][0]);
    });
};
