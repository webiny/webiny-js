// @flow
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import generateJWT from "../generateJWT";
type GetModelType = (context: Object) => Function;

const invalidCredentials = new ErrorResponse({
    code: "INVALID_CREDENTIALS",
    message: "Invalid credentials."
});

export default (getModel: GetModelType) => async (root: any, args: Object, context: Object) => {
    const SecurityUser = getModel(context);

    // Decode the login token
    let user;
    try {
        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("getUser"))
            .pop();

        user = await authPlugin.getUser({ idToken: args.idToken, SecurityUser }, context);
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
