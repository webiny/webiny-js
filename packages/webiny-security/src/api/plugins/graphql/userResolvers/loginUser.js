// @flow
import bcrypt from "bcryptjs";
import util from "util";
import { Response, ErrorResponse } from "webiny-api/graphql";
import { JwtToken } from "../../authentication/jwtToken";
import type { Entity } from "webiny-entity";
type EntityFetcher = (context: Object) => Class<Entity>;

const verifyPassword = util.promisify(bcrypt.compare);

const invalidCredentials = new ErrorResponse({
    code: "INVALID_CREDENTIALS",
    message: "Invalid credentials."
});

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const User = entityFetcher(context);

    const user: User = (await User.findOne({
        query: { email: args.username }
    }): any);

    if (!user) {
        return invalidCredentials;
    }

    // $FlowFixMe - user has a "password" attribute.
    if (!(await verifyPassword(args.password, user.password))) {
        return invalidCredentials;
    }

    // Generate token
    let expiration = context.config.security.token.expiresOn(args);
    if (expiration instanceof Date) {
        expiration = Math.floor(expiration.getTime() / 1000);
    }

    const jwt = new JwtToken({ secret: context.config.security.token.secret });
    const token = await jwt.encode(
        // $FlowFixMe - instance that will be validated will have "password" attribute.
        { id: user.id, type: "user", scopes: await user.scopes },
        // 2147483647 = maximum value of unix timestamp (year 2038).
        2147483647
    );

    return new Response({
        user,
        token,
        expiresOn: expiration
    });
};
