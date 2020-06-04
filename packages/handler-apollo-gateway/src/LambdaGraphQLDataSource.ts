import Lambda from "aws-sdk/clients/lambda";
import { GraphQLRequestContext, GraphQLResponse, ValueOrPromise } from "apollo-server-types";
import { Headers } from "apollo-server-env";

const lambda = new Lambda({});

export interface GraphQLDataSource {
    process<TContext>(
        request: Pick<GraphQLRequestContext<TContext>, "request" | "context">
    ): Promise<GraphQLResponse>;
}

export interface ApolloServerResponse {
    statusCode: number;
    body: string;
    headers: { [key: string]: string };
}

const headersToObject = headers => {
    const obj = {};
    for (const [key, value] of headers.entries()) {
        if (value !== "undefined") {
            obj[key] = value;
        }
    }

    return obj;
};

export class LambdaGraphQLDataSource implements GraphQLDataSource {
    constructor(
        config?: Partial<LambdaGraphQLDataSource> & object & ThisType<LambdaGraphQLDataSource>
    ) {
        if (config) {
            return Object.assign(this, config);
        }
    }

    willSendRequest: (
        requestContext: Pick<GraphQLRequestContext<any>, "request" | "context">
    ) => ValueOrPromise<void>;

    functionName: string;
    path = "/graphql";

    async process<TContext>({
        request,
        context
    }: Pick<GraphQLRequestContext<TContext>, "request" | "context">): Promise<GraphQLResponse> {
        const headers = (request.http && request.http.headers) || new Headers();
        headers.set("Content-Type", "application/json");

        request.http = {
            method: "POST",
            url: this.functionName,
            headers
        };

        if (this.willSendRequest) {
            await this.willSendRequest({ request, context });
        }

        const event = {
            headers: headersToObject(request.http.headers),
            body: Buffer.from(JSON.stringify(request)).toString("base64"),
            httpMethod: request.http.method,
            isBase64Encoded: true
        };

        const { Payload } = await lambda
            .invoke({
                FunctionName: this.functionName,
                Payload: JSON.stringify(event)
            })
            .promise();

        const response: ApolloServerResponse = JSON.parse(Payload as string);
        const body = JSON.parse(response.body);

        if (body.error) {
            throw body;
        }

        return body;
    }
}
