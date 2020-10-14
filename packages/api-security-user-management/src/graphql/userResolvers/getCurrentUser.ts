import { Response, NotFoundResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { PK_USER, SK_USER } from "@webiny/api-security-user-management/models/security.model";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const identity = context.security.getIdentity();

    if (identity) {
        const Model = context.models.Security;

        const securityRecord = await Model.findOne({
            query: { PK: `${PK_USER}#${identity.id}`, SK: SK_USER }
        });

        if (!securityRecord) {
            return new NotFoundResponse(`User with ID ${identity.id} was not found!`);
        }

        return new Response(securityRecord.data);
    }

    return new Response(null);
};

export default resolver;
