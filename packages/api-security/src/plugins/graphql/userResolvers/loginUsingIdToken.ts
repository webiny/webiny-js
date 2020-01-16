import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLContext, GraphQLFieldResolver } from "@webiny/api/types";
import { JWTPayload, SecurityAuthenticationProviderPlugin } from "../../../types";
import { JwtToken } from "../../authentication/jwtToken";

type GetModelType = (context: { [key: string]: any }) => Function;

const invalidCredentials = new ErrorResponse({
    code: "INVALID_CREDENTIALS",
    message: "Invalid credentials."
});

const generateJWT = async (user, context: GraphQLContext) => {
    const expiresOn = new Date();
    expiresOn.setSeconds(expiresOn.getSeconds() + context.security.token.expiresIn);

    // Convert to seconds to represent "number of seconds since the epoch"
    const seconds = Math.floor(expiresOn.getTime() / 1000);

    const jwt = new JwtToken({ secret: context.security.token.secret });
    const access = await user.access;

    let payload: JWTPayload = {
        id: user.id,
        type: "user",
        access
    };

    const authPlugin = context.plugins
        .byType<SecurityAuthenticationProviderPlugin>("security-authentication-provider")
        .filter(pl => pl.hasOwnProperty("createJWTPayload"))
        .pop();

    if (authPlugin) {
        payload = await authPlugin.createJWTPayload({ defaultPayload: payload }, context);
    }

    return {
        token: await jwt.encode(payload, seconds),
        expiresOn: seconds
    };
};

export default (getModel: GetModelType): GraphQLFieldResolver => async (root, args, context) => {
    const SecurityUser = getModel(context);

    // Decode the login token
    let user;
    const authPlugin = context.plugins
        .byType<SecurityAuthenticationProviderPlugin>("security-authentication-provider")
        .filter(pl => pl.hasOwnProperty("userFromToken"))
        .pop();

    try {
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
