// @flow
import { JwtToken } from "./jwtToken";

export default async (config: Object, event: Object, context: Object) => {
    let token = (event.headers.Authorization || "").replace("Bearer ", "");
    let user = null;
    if (token !== "" && event.httpMethod === "POST") {
        const jwt = new JwtToken({ secret: config.security.token.secret });
        user = (await jwt.decode(token)).data;

        // Assign token and user to context to be forwarded to ApolloServer
        context.token = token;
        context.user = user;
    }
};
