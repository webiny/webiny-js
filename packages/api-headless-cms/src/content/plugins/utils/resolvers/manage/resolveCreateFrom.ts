import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";
import { entryNotFound } from "./../entryNotFound";

export const resolveCreateFrom: ResolverFactory = ({ model }) => async (root, args, context) => {
    const Model = context.models[model.modelId];
    const baseRevision = await Model.findById(args.revision);

    if (!baseRevision) {
        return entryNotFound(JSON.stringify(args.where));
    }

    try {
        const newRevision = new Model();

        for (let i = 0; i < model.fields.length; i++) {
            const field = model.fields[i];
            if (baseRevision.getField(field.fieldId)) {
                const fieldValue = await baseRevision[field.fieldId];
                newRevision[field.fieldId] = fieldValue;
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
        return new ErrorResponse(e);
    }
};
