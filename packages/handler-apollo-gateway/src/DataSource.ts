import { LambdaGraphQLDataSource } from "./LambdaGraphQLDataSource";
import { GraphQLRequestContext, GraphQLResponse } from "apollo-server-types";

export class DataSource extends LambdaGraphQLDataSource {
    constructor({ onServiceError, ...config }: Partial<DataSource>) {
        super(config);
        this.onServiceError = onServiceError;
    }

    onServiceError?(error): void;

    async process<TContext>({
        request,
        context
    }: Pick<GraphQLRequestContext<TContext>, "request" | "context">): Promise<GraphQLResponse> {
        try {
            return await super.process({ request, context }).then(res => {
                if (res.errors) {
                    res.errors.map(error => this.onServiceError(error));
                }

                return res;
            });
        } catch (error) {
            this.onServiceError(error);
            return Promise.reject(error);
        }
    }
}
