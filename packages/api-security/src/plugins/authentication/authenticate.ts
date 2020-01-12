import { JwtToken } from "./jwtToken";

export default async (context: Record<string, any>) => {
    const { security, event } = context;
    const { headers } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";
    const token = authorization.replace(/[b|B]earer\s/, "");
    let user = null;
    if (token !== "" && event.httpMethod === "POST") {
        const jwt = new JwtToken({ secret: security.token.secret });
        const res: any = await jwt.decode(token);
        user = res.data;

        // Assign token and user to context to be forwarded to ApolloServer
        context.token = token;
        context.user = user;
    }
};
