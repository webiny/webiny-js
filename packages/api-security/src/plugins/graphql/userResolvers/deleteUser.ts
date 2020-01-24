import { ErrorResponse, Response, NotFoundResponse } from "@webiny/api";

export default userFetcher => async (
    root: any,
    args: { [key: string]: any },
    context: { [key: string]: any }
) => {
    const { id } = args;
    const User = userFetcher(context);
    const user = await User.findById(id);

    if (!user) {
        return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
    }

    try {
        await user.delete();

        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            // eslint-disable-next-line no-prototype-builtins
            .filter(pl => pl.hasOwnProperty("deleteUser"))
            .pop();

        await authPlugin.deleteUser({ user }, context);

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
