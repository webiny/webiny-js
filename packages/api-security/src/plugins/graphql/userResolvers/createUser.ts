import { ErrorResponse, Response } from "@webiny/api";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import { SecurityAuthenticationProviderPlugin } from "@webiny/api-security/types";
import { GraphQLFieldResolver } from "@webiny/api/types";

export default (userFetcher): GraphQLFieldResolver => async (root, args, context) => {
    const User = userFetcher(context);
    const user = new User();

    try {
        await user.populate(args.data).save();

        const authPlugin = context.plugins
            .byType<SecurityAuthenticationProviderPlugin>("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("createUser"))
            .pop();

        try {
            await authPlugin.createUser({ data: args.data, user }, context);
        } catch {
            // If user already exists we don't do anything on the auth provider side.
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
