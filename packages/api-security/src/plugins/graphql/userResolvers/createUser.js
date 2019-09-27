import { WithFieldsError } from "@webiny/commodo";
import { ErrorResponse, Response } from "@webiny/api/graphql/commodo";
import InvalidFieldsError from "@webiny/api/graphql/commodo/InvalidFieldsError";

export default userFetcher => async (root: any, args: Object, context: Object) => {
    const User = userFetcher(context);
    const user = new User();

    try {
        await user.populate(args.data).save();

        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("createUser"))
            .pop();

        await authPlugin.createUser({ data: args.data, user }, context);
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
