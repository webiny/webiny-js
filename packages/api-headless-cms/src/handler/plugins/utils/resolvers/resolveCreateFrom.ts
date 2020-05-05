import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { entryNotFound } from "./entryNotFound";
import { CmsContext } from "@webiny/api-headless-cms/types";

export const resolveCreateFrom = ({ model }): GraphQLFieldResolver<any, any, CmsContext> => async (
    root,
    args,
    context
) => {
    const Model = context.models[model.modelId];
    const baseRevision = await Model.findOne({ query: { id: args.revision } });

    if (!baseRevision) {
        return entryNotFound(JSON.stringify(args.where));
    }

    try {
        const newRevision = new Model();

        for (let i = 0; i < model.fields.length; i++) {
            const field = model.fields[i];
            if (baseRevision[field.fieldId]) {
                newRevision[field.fieldId] = baseRevision[field.fieldId];
            }
        }

        newRevision.meta.parent = baseRevision.meta.parent;
        newRevision.meta.environment = baseRevision.meta.environment;

        if (args.data) {
            newRevision.populate(args.data);
        }

        await newRevision.save();

        return new Response(newRevision);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
