import DataLoader from "dataloader";
import { CmsContentModelEntryType } from "@webiny/api-headless-cms/types";
import * as utils from "../../../../utils";

export const createRevisionsDataLoader = context => {
    return new DataLoader<string, CmsContentModelEntryType[]>(async keys => {
        const results = [];

        for (let i = 0; i < keys.length; i++) {
            const [entries] = await context.db.read({
                ...utils.defaults.db,
                query: {
                    PK: utils.createContentModelEntryPK(context),
                    SK: { $beginsWith: keys[i] }
                }
            });

            results.push(entries);
        }

        return results;
    });
};
