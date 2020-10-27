import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const identity = context.security.getIdentity();
    const { files } = context;
    const { data } = args;
    try {
        if (await files.get(data.id)) {
            return new NotFoundResponse(`File with id "${data.id}" already exists.`);
        }
        // Add meta data
        data.createdOn = data.savedOn = new Date().toISOString();
        data.createdBy = identity;

        await files.create(data);

        return new Response(data);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
