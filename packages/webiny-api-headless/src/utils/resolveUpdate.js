import { ObjectId } from "mongodb";
import { Response, ErrorResponse } from "webiny-api/graphql";
import findEntry from "webiny-api-headless/utils/findEntry";
import populateEntry from "webiny-api-headless/utils/populateEntry";
import saveEntry from "webiny-api-headless/utils/saveEntry";
import entryNotFound from "./entryNotFound";

export const resolveUpdate = ({ models, model }) => async (
    root: any,
    args: Object,
    context: Object
) => {
    args.where = { _id: ObjectId(args.id) };

    const entry = await findEntry({
        model,
        args,
        context
    });

    if (!entry) {
        return entryNotFound(args.id);
    }

    try {
        await populateEntry(entry, args.data, { models, model, context });
        await saveEntry(entry, { models, model, context });
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }

    return new Response(entry);
};
