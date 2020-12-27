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
                    PK: PK_ENTRY(),
                    SK: { $beginsWith: keys[i] }
                }
            });

            results.push(entries);
        }

        return results;
    });
};

export const getRevisionById = (context: CmsContext, { PK_ENTRY }) => {
    return new DataLoader<string, CmsContentEntryType>(async keys => {
        const batch = context.db.batch();
        batch.read(
            ...keys.map(id => ({
                ...utils.defaults.db,
                query: {
                    PK: PK_ENTRY(),
                    SK: id
                }
            }))
        );

        const results = (await batch.execute()) as [CmsContentEntryType[]][];

        // We're not filtering empty values here as we must return the same amount of items as the number of "keys".
        const items = results.map(result => {
            const items = result[0];

            return items[0];
        });

        return items;
    });
};

export const getPublishedRevisionById = (context: CmsContext, { PK_ENTRY_PUBLISHED }) => {
    return new DataLoader<string, CmsContentEntryType>(async keys => {
        const entries = await context.db
            .batch()
            .read(
                ...keys.map(id => ({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_ENTRY_PUBLISHED(),
                        SK: id
                    }
                }))
            )
            .execute();

        return entries.map(result => result[0][0]);
    });
};
