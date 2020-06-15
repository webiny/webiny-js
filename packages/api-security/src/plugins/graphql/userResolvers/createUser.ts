import { omit } from "lodash";
import { ErrorResponse, Response } from "@webiny/graphql";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import { SecurityAuthenticationProviderPlugin } from "@webiny/api-security/types";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export default (userFetcher): GraphQLFieldResolver => async (root, args, context) => {
    const User = userFetcher(context);
    const user = new User();
    await user.populate(args.data);

    const existingUser = await User.findOne({ query: { email: args.data.email } });
    if (existingUser) {
        return new ErrorResponse({
            code: "USER_EXISTS",
            message: "User with given e-mail already exists."
        });
    }

    try {
        const authPlugin = context.plugins
            .byType<SecurityAuthenticationProviderPlugin>("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("createUser"))
            .pop();

        const authUser = await authPlugin.getUser({ email: args.data.email });
        if (!authUser) {
            await authPlugin.createUser({ data: args.data, user }, context);
        } else {
            // Update firstName/lastName, but do not touch the existing password
            await authPlugin.updateUser({ data: omit(args.data, ["password"]), user }, context);
        }
        await user.save();
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
