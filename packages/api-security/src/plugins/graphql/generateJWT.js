import { JwtToken } from "../authentication/jwtToken";

export default async (user, context) => {
    let expiresOn = context.config.security.token.expiresOn();
    if (expiresOn instanceof Date) {
        expiresOn = Math.floor(expiresOn.getTime() / 1000);
    }

    const jwt = new JwtToken({ secret: context.config.security.token.secret });
    const access = await user.access;
    return {
        token: await jwt.encode(
            {
                id: user.id,
                type: "user",
                access
            },
            // 2147483647 = maximum value of unix timestamp (year 2038).
            2147483647
        ),
        expiresOn
    };
};
