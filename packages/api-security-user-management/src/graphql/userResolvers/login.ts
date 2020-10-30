import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const identity = context.security.getIdentity();

        if (!identity) {
            throw new Error("Not authorized!");
        }

        const { users } = context;

        const user = await users.get(identity.id);

        let firstLogin = false;
        let userData = user?.data;

        if (!userData) {
            firstLogin = true;
            // Create a "Security User"
            userData = await users.create({
                id: identity.id,
                email: identity.login,
                firstName: identity.firstName || "",
                lastName: identity.lastName || "",
                avatar: identity.avatar
            });
        }

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        if (typeof authPlugin.onLogin === "function") {
            await authPlugin.onLogin({ user: userData, firstLogin }, context);
        }

        return new Response(userData);
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data
        });
    }
};

export default resolver;
