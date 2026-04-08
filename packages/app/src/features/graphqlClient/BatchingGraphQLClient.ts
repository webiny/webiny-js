import { createDecorator } from "@webiny/di";
import { GraphQLClient } from "./abstractions.js";
import { RequestValue } from "~/features/graphqlClient/RequestValue.js";

interface BatchedRequest {
    request: RequestValue;
    resolve: (value: any) => void;
    reject: (error: any) => void;
}

interface BatchOperation {
    operationName: string | undefined;
    query: string;
    variables?: any;
}

class BatchingGraphQLClientImpl implements GraphQLClient.Interface {
    private queue: BatchedRequest[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly batchWindowMs: number;
    private readonly maxBatchSize: number;

    constructor(private decoratee: GraphQLClient.Interface) {
        // Default: 10ms window, max 10 operations per batch
        this.batchWindowMs = 10;
        this.maxBatchSize = 10;
    }

    async execute<TVariables = any, TResult = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request: RequestValue.from(params), resolve, reject });

            if (this.queue.length >= this.maxBatchSize) {
                this.flush();
                return;
            }

            if (!this.batchTimeout) {
                this.batchTimeout = setTimeout(() => {
                    this.flush();
                }, this.batchWindowMs);
            }
        });
    }

    private async flush(): Promise<void> {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        if (this.queue.length === 0) {
            return;
        }

        const batch = this.queue.splice(0, this.queue.length);

        // Single request - use decoratee directly (no batching needed)
        if (batch.length === 1) {
            const { request, resolve, reject } = batch[0];
            try {
                const result = await this.decoratee.execute(request.request);
                resolve(result);
            } catch (error) {
                reject(error);
            }
            return;
        }

        // Group requests by endpoint + headers (only batch requests with identical target)
        const grouped = new Map<string, BatchedRequest[]>();
        for (const item of batch) {
            const groupKey =
                item.request.endpoint + "|" + this.serializeHeaders(item.request.headers);
            if (!grouped.has(groupKey)) {
                grouped.set(groupKey, []);
            }
            grouped.get(groupKey)!.push(item);
        }

        // Process each group separately
        const batchPromises = Array.from(grouped.entries()).map(requests => {
            const group = requests[1];

            if (group.length === 1) {
                // Single request in this group - use decoratee directly
                const { request, resolve, reject } = group[0];
                return this.decoratee.execute(request.request).then(resolve).catch(reject);
            }

            // Multiple requests with same headers - batch them
            return this.executeBatchGroup(group);
        });

        await Promise.all(batchPromises);
    }

    private async executeBatchGroup(group: BatchedRequest[]): Promise<void> {
        const batchedOperations = group.map(({ request }): BatchOperation => {
            return {
                query: request.queryAsString,
                operationName: request.operationName,
                variables: request.variables
            };
        });

        const endpoint = group[0].request.endpoint;
        const headers = group[0].request.headers;

        try {
            const results = await this.executeBatch(endpoint, batchedOperations, headers);
            group.forEach(({ resolve }, index) => {
                resolve(results[index]);
            });
        } catch (error) {
            group.forEach(({ reject }) => {
                reject(error);
            });
        }
    }

    private serializeHeaders(headers?: GraphQLClient.Headers): string {
        if (!headers) {
            return "{}";
        }
        // Sort keys for consistent serialization
        const sortedKeys = Object.keys(headers).sort();
        const sortedHeaders: Record<string, string> = {};
        for (const key of sortedKeys) {
            sortedHeaders[key] = String(headers[key]);
        }
        return JSON.stringify(sortedHeaders);
    }

    private async executeBatch(
        endpoint: string,
        operations: BatchOperation[],
        headers?: GraphQLClient.Headers
    ): Promise<any[]> {
        let response: Response;

        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(headers || {})
                },
                body: JSON.stringify(operations)
            });
        } catch (err) {
            throw new Error(`Network error: ${(err as Error).message}`);
        }

        let json: any;
        try {
            json = await response.json();
        } catch {
            throw new Error("Failed to parse GraphQL batch response as JSON.");
        }

        if (!Array.isArray(json)) {
            throw new Error("Expected batch response to be an array");
        }

        // Map each result, handling individual errors
        return json.map((result: any, index: number) => {
            if (result.errors && result.errors.length > 0) {
                throw new Error(
                    `GraphQL errors in operation ${index}: ${JSON.stringify(result.errors)}`
                );
            }
            return result.data;
        });
    }
}

export const BatchingGraphQLClient = createDecorator({
    abstraction: GraphQLClient,
    decorator: BatchingGraphQLClientImpl,
    dependencies: []
});
