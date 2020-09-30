import { Response } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

type GetModelType = (context: { [key: string]: any }) => Function;

export default (getModel: GetModelType): GraphQLFieldResolver => async (root, args, context) => {
    const identity = context.security.getIdentity();

    if (!identity) {
        throw Error("Not authorized!");
    }

    const SecurityUser: any = getModel(context);
    let user = await SecurityUser.findOne({ query: { id: identity.id } });

    let firstLogin = false;

    if (!user) {
        firstLogin = true;
        user = new SecurityUser();
        user.populate({
            id: identity.id,
            email: identity.login,
            firstName: identity.firstName || "",
            lastName: identity.lastName || ""
        });
        await user.save();
    }

    const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
        "security-user-management"
    );

    if (typeof authPlugin.onLogin === "function") {
        await authPlugin.onLogin({ user, firstLogin }, context);
    }

    return new Response(user);
};
