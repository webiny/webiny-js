import { Response, NotFoundResponse, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { SecurityUser } = context.models;

    const { security, plugins } = context;

    const currentUser = await SecurityUser.findOne({ query: { id: security.getIdentity().id } });
    if (currentUser) {
        try {
            currentUser.populate(args.data);
            await currentUser.save();

            const authPlugin = plugins.byName<SecurityUserManagementPlugin>(
                "security-user-management"
            );

            if (authPlugin) {
                await authPlugin.updateUser({ data: args.data, user: currentUser }, context);
            }

            return new Response(currentUser);
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
