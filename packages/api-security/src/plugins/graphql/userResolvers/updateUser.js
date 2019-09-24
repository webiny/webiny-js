import { ModelError } from "@webiny/model";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/api/graphql";
import InvalidAttributesError from "@webiny/api/graphql/InvalidAttributesError";

export default userFetcher => async (root: any, args: Object, context: Object) => {
    const { id, ...data } = args;
    const User = userFetcher(context);
    const user = await User.findById(id);

    if (!user) {
        return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
    }

    try {
        await user.populate(data).save();

        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("updateUser"))
            .pop();

        await authPlugin.updateUser({ data: args.data, user }, context);
    } catch (e) {
        if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
            const attrError = InvalidAttributesError.from(e);
            return new ErrorResponse({
                code: attrError.code || "INVALID_ATTRIBUTES",
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
