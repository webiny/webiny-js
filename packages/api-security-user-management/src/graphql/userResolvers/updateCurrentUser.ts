import { Response, NotFoundResponse, ErrorResponse } from "@webiny/graphql/responses";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { security, plugins, users } = context;
    const { data } = args;

    const identity = security.getIdentity();
    let existingUserData = await users.get(identity.id);

    if (existingUserData) {
        try {
            existingUserData = await users.update({ id: identity.id, data, existingUserData });

            const authPlugin = plugins.byName<SecurityUserManagementPlugin>(
                "security-user-management"
            );

            if (authPlugin) {
                await authPlugin.updateUser({ data, user: existingUserData }, context);
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
