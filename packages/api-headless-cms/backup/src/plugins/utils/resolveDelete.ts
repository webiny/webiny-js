import { GraphQLFieldResolver } from "@webiny/api/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { findEntry } from "./findEntry";
import { entryNotFound } from "./entryNotFound";
import { setContextLocale } from "./setContextLocale";

export const resolveDelete = ({ model }): GraphQLFieldResolver => async (root, args, context) => {
    setContextLocale(context, args.locale);
    const instance = await findEntry({ model, args, context });

    if (!instance) {
        return entryNotFound(JSON.stringify(args.where));
    }

    try {
        await instance.delete();
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
