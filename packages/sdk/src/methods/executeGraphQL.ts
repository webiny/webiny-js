import type { CmsSdkConfig } from "../types.js";
import { Result } from "../Result.js";
import { HttpError, GraphQLError, NetworkError } from "../errors.js";

export async function executeGraphQL(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    query: string,
    variables: Record<string, unknown> = {}
): Promise<Result<any, HttpError | GraphQLError | NetworkError>> {
    const url = `${config.endpoint}/graphql`;

    let response: Response;

    try {
        response = await fetchFn(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.token}`,
                "x-tenant": config.tenant,
                "x-webiny-sdk": "v6"
            },
            body: JSON.stringify({ query, variables })
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
    } catch (error) {
        return Result.fail(new NetworkError("Failed to parse response JSON"));
    }

    if (result.errors) {
        const error = result.errors[0];
        return Result.fail(new GraphQLError(error?.message || "GraphQL error", error?.code));
    }

    return Result.ok(result.data);
}
