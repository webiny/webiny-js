import DataLoader from "dataloader";
import { CmsContentModelEntryType, CmsContext } from "@webiny/api-headless-cms/types";
import * as utils from "../../../../utils";

export const createRevisionsDataLoader = (context: CmsContext, { PK_ENTRY }) => {
    return new DataLoader<string, CmsContentModelEntryType[]>(async keys => {
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
