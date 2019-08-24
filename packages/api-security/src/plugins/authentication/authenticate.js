// @flow
import { JwtToken } from "./jwtToken";

export default async (context: Object) => {
    const { config, event } = context;
    const { headers } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";
    let token = authorization.replace(/[b|B]earer\s/, "");
    let user = null;
    if (token !== "" && event.httpMethod === "POST") {
        const jwt = new JwtToken({ secret: config.security.token.secret });
        user = (await jwt.decode(token)).data;

        // Assign token and user to context to be forwarded to ApolloServer
        context.token = token;
        context.user = user;
    }
};
