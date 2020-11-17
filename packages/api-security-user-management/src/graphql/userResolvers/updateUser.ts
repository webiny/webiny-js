import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/handler-graphql/responses";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { id, data } = args;

    try {
        const { users } = context;

        let user = await users.get(id);

        if (!user) {
            return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
        }
        user = await users.update({ id, data, existingUserData: user });

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        if (authPlugin) {
            await authPlugin.updateUser({ data, user }, context);
        }

        return new Response(user);
    } catch (e) {
        return new ErrorResponse(e);
    }
};

export default resolver;
