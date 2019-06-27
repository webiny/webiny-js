import { ObjectId } from "mongodb";
import { getPlugins } from "webiny-plugins";
import createPaginationMeta from "webiny-entity/createPaginationMeta";
import createCollectionName from "webiny-api-headless/utils/createCollectionName";
import parseBoolean from "./parseBoolean";

const fieldMap = {
    id: "_id"
};

function mapFieldId(fieldId) {
    if (fieldId in fieldMap) {
        return fieldMap[fieldId];
    }
    return fieldId;
}

export default async function findEntries({ model, args, context }) {
    const db = context.getDatabase();
    const collectionName = createCollectionName(model.modelId);
    const collection = db.collection(collectionName);

    parseBoolean(args);
    let { where, sort, perPage, page } = args;
    page = isNaN(page) || page < 1 ? 1 : page;
    perPage = isNaN(perPage) || perPage < 1 ? 100 : perPage;

    const match = {};
    const filterOperators = getPlugins("cms-headless-filter-operator");

    function setCondition(key) {
        const value = where[key];
        const delim = key.indexOf("_");
        const fieldId = mapFieldId(key.substring(0, delim > 0 ? delim : undefined));
        let operator = delim > 0 ? key.substring(delim + 1) : "eq";

        const operatorPlugin = filterOperators.find(pl => pl.operator === operator);
        if (!operatorPlugin) {
            return;
        }

        const field = model.fields.find(f => f.fieldId === fieldId);
        match[fieldId] = operatorPlugin.createCondition({ fieldId, field, value, context });
    }

    Object.keys(where).forEach(setCondition);

    console.log("where", where);
    console.log("match", match);

    const entries = await collection
        .find(match)
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
                          $match: match
                      }
                    : null,
                sort ? { $sort: sort } : null,
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
