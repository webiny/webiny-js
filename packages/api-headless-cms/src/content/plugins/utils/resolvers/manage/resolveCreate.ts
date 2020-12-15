import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentModelEntryResolverFactoryType as ResolverFactory } from "@webiny/api-headless-cms/types";

export const resolveCreate: ResolverFactory = ({ model }) => async (root, args, context) => {
    try {
        // const Model = context.models[model.modelId];
        // const instance = new Model();
        // instance.populate(args.data);
        // await instance.save();

        // TODO: implement entry create for given `model`

        return new Response({});
    } catch (e) {
        return new ErrorResponse(e);
    }
};
