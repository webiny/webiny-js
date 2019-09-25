import { createPaginationMeta } from "@webiny/commodo";
import createCollectionName from "@webiny/api-cms/utils/createCollectionName";
import createMongoSorters from "@webiny/api-cms/utils/createMongoSorters";
import createMongoQuery from "@webiny/api-cms/utils/createMongoQuery";
import parseBoolean from "./parseBoolean";

export default async function findEntries({ model, args, context, info }) {
    const db = context.getDatabase();
    const collectionName = createCollectionName(model.modelId);
    const collection = db.collection(collectionName);

    // Create a local copy of context and override the `locale` value
    const localContext = { ...context };
    if (args.locale) {
        localContext.locale = args.locale;
    }

    parseBoolean(args);
    let { where = {}, sort = [], perPage, page } = args;
    page = isNaN(page) || page < 1 ? 1 : page;
    perPage = isNaN(perPage) || perPage < 1 ? 100 : perPage;

    const match = createMongoQuery(model, where, localContext);
    const sorters = createMongoSorters(model, sort);

    const entries = await collection
        .find(match)
        .sort(sorters)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();

    // Set entry locale
    entries.forEach(entry => (entry._locale = args.locale || context.locale));

    // Create meta
    const { selections } = info.fieldNodes[0].selectionSet;
    const metaField = selections.find(s => s.name.value === "meta");

    if (!metaField) {
        return { entries };
    }

    const [res] = await collection
        .aggregate(
            [
                where
                    ? {
                          $match: match
                      }
                    : null,
                sort ? { $sort: sorters } : null,
                {
                    $count: "totalCount"
                }
            ].filter(Boolean)
        )
        .toArray();

    return {
        entries,
        meta: createPaginationMeta({ page, perPage, totalCount: res ? res.totalCount : 0 })
    };
}
