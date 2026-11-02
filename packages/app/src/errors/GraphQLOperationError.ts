export interface GraphQLOperationErrorInput {
    message: string;
    code?: string | null;
    data?: unknown;
}

/*
 * Thrown by gateways and use cases when a GraphQL operation answers with an error envelope.
 * Unlike a plain `Error`, it keeps the server's machine-readable `code` and its `data`, so
 * callers can react to a specific refusal with `instanceof` and `code`.
 */
export class GraphQLOperationError extends Error {
    readonly code: string | null;
    readonly data: unknown;

    constructor(input: GraphQLOperationErrorInput) {
        super(input.message);
        this.name = "GraphQLOperationError";
        this.code = input.code ?? null;
        this.data = input.data ?? null;
    }
}
