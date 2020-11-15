import { WithFieldsError } from "@commodo/fields";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql/responses";
import InvalidFieldsError from "@webiny/commodo-graphql/InvalidFieldsError";
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
