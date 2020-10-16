import { Response, NotFoundResponse, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";
import { PK_USER, SK_USER } from "@webiny/api-security-user-management/models/securityUserData.model";
import { updateSecurityUser } from "@webiny/api-security-user-management/graphql/userResolvers/utils";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const Model = context.models.Security;

    const { security, plugins } = context;

    const securityRecord = await Model.findOne({
        query: { PK: `${PK_USER}#${security.getIdentity().id}`, SK: SK_USER }
    });
    if (securityRecord) {
        try {
            const currentUser = securityRecord.data;
            currentUser.populate(args.data);

            await updateSecurityUser({ Model, modelInstance: securityRecord, user: currentUser });

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
