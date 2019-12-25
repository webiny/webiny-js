import { JwtToken } from "../authentication/jwtToken";

export default async (user, context) => {
    const expiresOn = new Date();
    expiresOn.setSeconds(expiresOn.getSeconds() + context.security.token.expiresIn);

    // Convert to seconds to represent "number of seconds since the epoch"
    const seconds = Math.floor(expiresOn.getTime() / 1000);

    const jwt = new JwtToken({ secret: context.security.token.secret });
    const access = await user.access;
    return {
        token: await jwt.encode(
            {
                id: user.id,
                type: "user",
                access
            },
            seconds
        ),
        expiresOn: seconds
    };
};
