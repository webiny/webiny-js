import { Response } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/api/types";
import { findEntry } from "./findEntry";
import { setContextLocale } from "./setContextLocale";
import { entryNotFound } from "./entryNotFound";

export const resolveGet = ({ model }): GraphQLFieldResolver => async (root, args, context) => {
    setContextLocale(context, args.locale);

    const entry = await findEntry({ model, args, context });

    if (!entry) {
        return entryNotFound();
    }

    return new Response(entry);
};
