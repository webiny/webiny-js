import type { WebinyConfig } from "../types.js";
import { Result } from "../Result.js";
import { HttpError, GraphQLError, NetworkError } from "../errors.js";

export async function executeGraphQL(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    query: string,
    variables: Record<string, unknown> = {}
): Promise<Result<any, HttpError | GraphQLError | NetworkError>> {
    const url = `${config.endpoint}/graphql`;

    let response: Response;

    try {
        const body = JSON.stringify({ query, variables });

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Tenant": config.tenant ?? "root",
            ...config.headers
        };

        console.log("headers", headers);
        // Only add Authorization header if token is provided and not already set in custom headers.
        if (config.token && !headers.Authorization) {
            headers.Authorization = `Bearer ${config.token}`;
        }

        response = await fetchFn(url, {
            method: "POST",
            headers,
            body,
            credentials: "include"
        });
    } catch (error) {
        return Result.fail(
            new NetworkError(error instanceof Error ? error.message : "Network request failed")
        );
    }

    if (!response.ok) {
        return Result.fail(
            new HttpError(response.status, `HTTP error! status: ${response.status}`)
        );
    }

    let result: any;
    try {
        result = await response.json();
    } catch {
        return Result.fail(new NetworkError("Failed to parse response JSON"));
    }

    if (result.errors) {
        const error = result.errors[0];
        return Result.fail(new GraphQLError(error?.message || "GraphQL error", error?.code));
    }

    return Result.ok(result.data);
}
