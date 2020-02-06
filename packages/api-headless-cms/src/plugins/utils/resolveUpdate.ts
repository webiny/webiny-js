import { ObjectId } from "mongodb";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import findEntry from "./findEntry";
import populateEntry from "./populateEntry";
import saveEntry from "./saveEntry";
import entryNotFound from "./entryNotFound";
import { GraphQLFieldResolver } from "@webiny/api/types";

export const resolveUpdate = ({ models, model }): GraphQLFieldResolver => async (
    root,
    args,
    context
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
