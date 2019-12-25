import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import generateJWT from "../generateJWT";
type GetModelType = (context: { [key: string]: any }) => Function;

const invalidCredentials = new ErrorResponse({
    code: "INVALID_CREDENTIALS",
    message: "Invalid credentials."
});

export default (getModel: GetModelType) => async (
    root: any,
    args: { [key: string]: any },
    context: { [key: string]: any }
) => {
    const SecurityUser = getModel(context);

    // Decode the login token
    let user;
    try {
        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            // eslint-disable-next-line no-prototype-builtins
            .filter(pl => pl.hasOwnProperty("userFromToken"))
            .pop();

        user = await authPlugin.userFromToken({ idToken: args.idToken, SecurityUser }, context);
    } catch (err) {
        return new ErrorResponse({
            code: err.code,
            message: err.message
        });
    }

    if (!user) {
        return invalidCredentials;
    }

    // Generate token
    const { token, expiresOn } = await generateJWT(user, context);

    return new Response({
        user,
        token,
        expiresOn
    });
};
