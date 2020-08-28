import { WithFieldsError } from "@webiny/commodo";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

export default (userFetcher): GraphQLFieldResolver => async (root, args, context) => {
    const { id, data } = args;
    const User = userFetcher(context);
    const user = await User.findById(id);

    if (!user) {
        return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
    }

    try {
        await user.populate(data).save();

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        if (authPlugin) {
            await authPlugin.updateUser({ data: args.data, user }, context);
        }
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
    return new Response(user);
};
