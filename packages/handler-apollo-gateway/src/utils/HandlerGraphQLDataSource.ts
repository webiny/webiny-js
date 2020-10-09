import { GraphQLRequestContext, GraphQLResponse } from "apollo-server-types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerClientContext } from "@webiny/handler-client/types";

type ApolloServerResponse = {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
};

export default class HandlerGraphQLDataSource {
    functionName: string;
    context: HandlerContext & HandlerHttpContext & HandlerClientContext;
    constructor({ functionName, context }) {
        this.functionName = functionName;

        // This is only the first context - the one that is passed on the data source instantiation.
        this.context = context;
    }

    async process({ request, context }: GraphQLRequestContext): Promise<GraphQLResponse> {
        // We always rely on the context's "http" object for fetching the "method" and "headers" data. Not sure why,
        // but "request.http.headers" always comes in as undefined, even though we are sending headers via the
        // "runHttpQuery" function call, above. Go figure. ¯\_(ツ)_/¯
        const http = context.http || this.context.http;

        const payload = {
            httpMethod: http.method,
            headers: http.headers,
            body: JSON.stringify({
                query: request.query,
                operationName: request.operationName,
                variables: request.variables
            })
        };

        const response = await this.context.handlerClient.invoke<ApolloServerResponse>({
            name: this.functionName,
            payload
        });

        const body = JSON.parse(response.body);

        if (body.error) {
            throw body;
        }

        return body;
    }
}
