import { createImplementation } from "@webiny/di";
import { GraphQLClient } from "./abstractions.js";
import { RequestValue } from "~/features/graphqlClient/RequestValue.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { publishExtensions } from "./publishExtensions.js";

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

        return this.fetch<TResult>(request, body);
    }

    private async fetch<TResult = any>(request: RequestValue, body: string): Promise<TResult> {
        const endpoint = request.endpoint;
        const headers = request.headers;
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

        /*
         * `execute` returns only `data`, so this is the one place the response's extensions are
         * still in reach. Announced before the error check below: a failed operation is exactly
         * the one whose debug data is wanted.
         */
        await publishExtensions(this.eventPublisher, {
            endpoint,
            operationName: request.operationName,
            extensions: json.extensions
        });

        /**
         * A GraphQL response can carry BOTH `data` and `errors` (partial success): a non-nullable
         * field error nulls that field and bubbles up to the nearest nullable ancestor, while the
         * rest of `data` stays valid and usable. We only treat errors as fatal when there is no
         * data to return — otherwise callers are free to consume the partial payload.
         */
        if (json.errors && json.errors.length > 0 && !json.data) {
            throw new Error(`GraphQL errors`, { cause: json.errors });
        }
        return json.data as TResult;
    }
}

export const FetchGraphQLClient = createImplementation({
    abstraction: GraphQLClient,
    implementation: GraphQLClientImpl,
    dependencies: [EventPublisher]
});
