import createCollectionName from "webiny-api-headless/utils/createCollectionName";
import parseBoolean from "./parseBoolean";

export default async function findEntry({ model, args, context }) {
    const db = context.getDatabase();
    const collectionName = createCollectionName(model.modelId);
    const collection = db.collection(collectionName);

    parseBoolean(args);
    let { where, sort } = args;

    const [entry] = await collection
        .find(where)
        .sort(sort)
        .limit(1)
        .toArray();

    return entry;
}
