import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { files } = context;
    const { data } = args;
    try {
        if (!(await files.get(data.id))) {
            return new NotFoundResponse(`File with id "${data.id}" does not exists.`);
        }
        // Add meta data
        data.savedOn = new Date().toISOString();

        await files.update(data);

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
