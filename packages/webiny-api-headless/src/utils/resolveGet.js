import { ObjectId } from "mongodb";
import { Response } from "webiny-api/graphql";
import entryNotFound from "./entryNotFound";
import findEntry from "webiny-api-headless/utils/findEntry";

export const resolveGet = ({ model }: Object) => async (
    root: any,
    args: Object,
    context: Object
) => {
    if (args.id) {
        args.where = { _id: ObjectId(args.id) };
    }

    const entry = await findEntry({ model, args, context });

    if (!entry) {
        return entryNotFound();
    }
    return new Response(entry);
};
