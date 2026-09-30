import { createImplementation } from "@webiny/di";
import { GraphQLClient } from "./abstractions.js";
import { RequestValue } from "~/features/graphqlClient/RequestValue.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { GraphQLExtensionsEvent } from "./GraphQLExtensionsEvent.js";

interface IFetchResult<TResult> {
    data: TResult;
    extensions?: Record<string, any>;
}

class GraphQLClientImpl implements GraphQLClient.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const request = RequestValue.from(params);

        const body = JSON.stringify({
            query: request.queryAsString,
            variables: request.variables,
            operationName: request.operationName
        });

        const { data, extensions } = await this.fetch<TResult>(
            request.endpoint,
            body,
            request.headers
        );

        /**
         * Only when the response actually carries extensions, so ordinary traffic pays nothing.
         * Failing to announce them must not fail the request that produced them.
         */
        if (extensions) {
            try {
                await this.eventPublisher.publish(
                    new GraphQLExtensionsEvent({
                        endpoint: request.endpoint,
                        operationName: request.operationName,
                        extensions
                    })
                );
            } catch {
                // An observer's problem is not the caller's problem.
            }
        }

        return data;
    }

    private async fetch<TResult = any>(
        endpoint: string,
        body: string,
        headers: GraphQLClient.Headers = {}
    ): Promise<IFetchResult<TResult>> {
        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(headers || {})
                },
                body
            });
        } catch (err) {
            throw new Error(`Network error: ${(err as Error).message}`);
        }
        let json: any;
        try {
            json = await response.json();
        } catch {
            throw new Error("Failed to parse GraphQL response as JSON.");
        }

        // Check for generic API errors
        if (response.status !== 200) {
            throw { message: json.message, code: json.code };
        }

        // Check for GraphQL errors
        if (json.errors && json.errors.length > 0) {
            throw new Error(`GraphQL errors`, { cause: json.errors });
        }
        return { data: json.data as TResult, extensions: json.extensions };
    }
}

export const FetchGraphQLClient = createImplementation({
    abstraction: GraphQLClient,
    implementation: GraphQLClientImpl,
    dependencies: [EventPublisher]
});
