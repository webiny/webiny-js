import { Response, ErrorResponse, NotFoundResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { files } = context;
    const { id } = args;
    try {
        const file = await files.get(id);
        if (!file) {
            return new NotFoundResponse(`File with id "${id}" does not exists.`);
        }

        return new Response({ ...file, id: file.SK });
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
