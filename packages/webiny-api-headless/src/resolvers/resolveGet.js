import { ObjectId } from "mongodb";
import { Response } from "webiny-api/graphql";
import createCollectionName from "webiny-api-headless/utils/createCollectionName";
import entryNotFound from "./entryNotFound";

export const resolveGet = ({ model }: Object) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const db = context.getDatabase();
    const collectionName = createCollectionName(model.modelId);
    const collection = db.collection(collectionName);

    if (args.id) {
        const entry = await collection.findOne({ _id: ObjectId(args.id) });
        if (!entry) {
            return entryNotFound(args.id);
        }
        return new Response(entry);
    }

    const entry = await collection.findOne(args.where);

    if (!entry) {
        return entryNotFound();
    }
    return new Response(entry);
};
