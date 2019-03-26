// @flow
import { Response, ErrorResponse } from "webiny-api/graphql";
import { JwtToken } from "../../authentication/jwtToken";
import type { Entity } from "webiny-entity";
type EntityFetcher = (context: Object) => Class<Entity>;

const invalidCredentials = new ErrorResponse({
    code: "INVALID_CREDENTIALS",
    message: "Invalid credentials."
});

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const jwt = new JwtToken({ secret: context.config.security.token.secret });

    // Decode the login token
    const { data } = await jwt.decode(args.token);

    const User = entityFetcher(context);

    const user: User = (await User.findOne({
        query: { email: data.email }
    }): any);

    if (!user) {
        return invalidCredentials;
    }

    // Generate token
    let expiration = context.config.security.token.expiresOn(args);
    if (expiration instanceof Date) {
        expiration = Math.floor(expiration.getTime() / 1000);
    }

    // $FlowFixMe
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
