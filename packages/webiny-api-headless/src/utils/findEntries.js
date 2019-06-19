import createPaginationMeta from "webiny-entity/createPaginationMeta";
import createCollectionName from "webiny-api-headless/utils/createCollectionName";
import parseBoolean from "./parseBoolean";
import prepareSearch from "./prepareSearch";

export default async function findEntries({ model, args, context }) {
    const db = context.getDatabase();
    const collectionName = createCollectionName(model.modelId);
    const collection = db.collection(collectionName);

    parseBoolean(args);
    let { where, sort, perPage, page, search } = args;
    page = isNaN(page) || page < 1 ? 1 : page;
    perPage = isNaN(perPage) || perPage < 1 ? 100 : perPage;

    where = { ...where, ...prepareSearch(search) };

    const entries = await collection
        .find(where)
        .sort(sort)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();

    // Get totalCount
    const [res] = await collection
        .aggregate(
            [
                where
                    ? {
                          $match: where
                      }
                    : null,
                sort ? { $sort: sort } : null,
                {
                    $count: "totalCount"
                }
            ].filter(Boolean)
        )
        .toArray();

    return { entries, meta: createPaginationMeta({ page, perPage, totalCount: res.totalCount }) };
}
