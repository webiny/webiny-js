import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import { SecurityUserManagementPlugin } from "@webiny/api-security-user-management/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { id } = args;
    const { users } = context;

    try {
        const user = await users.get(id);

        if (!user) {
            return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
        }

        await users.delete(id);

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        await authPlugin.deleteUser({ user: user.data }, context);

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
