import type { ApiSession } from "./apiSession.ts";

/** The main API, `/graphql`, or the Headless CMS manage API, `/cms/manage`. */
export type GraphqlEndpoint = "graphql" | "cms/manage";

export interface GraphqlError {
    message: string;
}

export interface GraphqlResult<T> {
    data?: T;
    errors?: GraphqlError[];
}

/**
 * Sends one GraphQL request as the signed-in admin and returns the parsed body. It does not look at
 * `errors` or at the operation's own `error` field: the caller decides what a failure means.
 */
export const callGraphql = async <T>(
    session: ApiSession,
    endpoint: GraphqlEndpoint,
    query: string,
    variables: Record<string, unknown> = {}
): Promise<GraphqlResult<T>> => {
    const response = await fetch(`${session.apiUrl}/${endpoint}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
        throw new Error(`POST /${endpoint} answered ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as GraphqlResult<T>;
};

/** Throws with the GraphQL errors, if any; otherwise returns `data`. */
export const requireData = <T>(result: GraphqlResult<T>, operation: string): T => {
    if (result.errors?.length || !result.data) {
        const messages = (result.errors ?? []).map(error => error.message).join("; ");
        throw new Error(`${operation} failed: ${messages || "no data"}`);
    }
    return result.data;
};
