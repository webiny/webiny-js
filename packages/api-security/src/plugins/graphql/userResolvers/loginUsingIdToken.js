// @flow
import { Response, ErrorResponse } from "@webiny/api/graphql/commodo";
import { JwtToken } from "../../authentication/jwtToken";
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
    let expiration = context.config.security.token.expiresOn(args);
    if (expiration instanceof Date) {
        expiration = Math.floor(expiration.getTime() / 1000);
    }

    const jwt = new JwtToken({ secret: context.config.security.token.secret });
    const access = await user.access;
    const token = await jwt.encode(
        // $FlowFixMe - instance that will be validated will have "password" attribute.
        {
            id: user.id,
            type: "user",
            access
        },
        // 2147483647 = maximum value of unix timestamp (year 2038).
        2147483647
    );

    return new Response({
        user,
        token,
        expiresOn: expiration
    });
};
