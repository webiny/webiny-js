import createCollectionName from "@webiny/api-headless/utils/createCollectionName";
import createMongoSorters from "@webiny/api-headless/utils/createMongoSorters";
import createMongoQuery from "@webiny/api-headless/utils/createMongoQuery";
import parseBoolean from "./parseBoolean";

export default async function findEntry({ model, args, context }) {
    const db = context.getDatabase();
    const collectionName = createCollectionName(model.modelId);
    const collection = db.collection(collectionName);

    // Create a shallow copy of context and override the `locale` value
    const localContext = { ...context };
    if (args.locale) {
        localContext.locale = args.locale;
    }

    parseBoolean(args);
    let { where, sort } = args;

    const match = createMongoQuery(model, where, localContext);
    const sorters = createMongoSorters(model, sort);

    const [entry] = await collection
        .find(match)
        .sort(sorters)
        .limit(1)
        .toArray();

    return entry;
}
