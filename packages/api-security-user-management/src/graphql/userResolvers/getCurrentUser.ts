import { Response, NotFoundResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const identity = context.security.getIdentity();

    if (identity) {
        const { SecurityUser } = context.models;
        const user = await SecurityUser.findOne({ query: { id: identity.id } });
        if (!user) {
            return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
        }

        return new Response(user);
    }

    return new Response(null);
};

export default resolver;
