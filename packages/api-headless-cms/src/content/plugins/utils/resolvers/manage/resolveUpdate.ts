import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";
import { entryNotFound } from "./../entryNotFound";
import { findEntry } from "../../findEntry";

export const resolveUpdate: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        let instance;
        // For the MANAGE API, we also allow getting entries directly by ID.
        if (context.cms.MANAGE && args.where && args.where.id) {
            const Model = context.models[model.modelId];
            instance = await Model.findById(args.where.id);
        } else {
            instance = await findEntry({ model, args, context });
        }

        if (!instance) {
            return entryNotFound(JSON.stringify(args.where));
        }

        instance.populate(args.data);
        await instance.save();
        return new Response(instance);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
