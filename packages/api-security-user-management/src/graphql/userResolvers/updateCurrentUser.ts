import { Response, NotFoundResponse, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { security, plugins, users } = context;
    const { data } = args;

    const identity = security.getIdentity();
    const user = await users.get(identity.id);

    if (user) {
        try {
            let existingUserData = user.data;

            existingUserData = await users.update({ id: identity.id, data, existingUserData });

            const authPlugin = plugins.byName<SecurityUserManagementPlugin>(
                "security-user-management"
            );

            if (authPlugin) {
                await authPlugin.updateUser({ data: args.data, user: existingUserData }, context);
            }

            return new Response(existingUserData);
        } catch (e) {
            return new ErrorResponse({
                code: e.code,
                message: e.message,
                data: e.data || null
            });
        }
    }

    return new NotFoundResponse("User not found!");
};

export default resolver;
