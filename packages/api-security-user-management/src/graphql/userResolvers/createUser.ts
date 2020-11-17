import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, { data }, context) => {
    const { users } = context;

    try {
        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        await authPlugin.createUser({ data, user: data }, context);

        const user = await users.create(data);

        return new Response(user);
    } catch (e) {
        return new ErrorResponse(e);
    }
};

export default resolver;
