import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError, ErrorResponse, Response } from "@webiny/commodo-graphql";
import { SecurityUserManagementPlugin } from "../../types";
import { createSecurityUser } from "@webiny/api-security-user-management/graphql/userResolvers/utils";

const resolver: GraphQLFieldResolver = async (root, { data }, context) => {
    const Model = context.models.SECURITY;
    const { SecurityUser } = context.models;

    try {
        const identity = context.security.getIdentity();

        const user = new SecurityUser();
        await user.populate({
            createdBy: identity,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            group: data.group,
            avatar: data.avatar,
            personalAccessTokens: data.personalAccessTokens
        });

        await createSecurityUser({ Model, user });

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        await authPlugin.createUser({ data: data, user }, context);

        return new Response(user);
    } catch (e) {
        if (e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS) {
            const attrError = InvalidFieldsError.from(e);
            return new ErrorResponse({
                code: attrError.code || WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS,
                message: attrError.message,
                data: attrError.data
            });
        }
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
