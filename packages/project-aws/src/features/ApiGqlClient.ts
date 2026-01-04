import { ApiGqlClient as ApiGqlClientAbstraction } from "~/abstractions/ApiGqlClient.js";
import { ApiStackOutputService } from "~/abstractions/index.js";
import { InvokeLambdaFunction } from "~/abstractions/InvokeLambdaFunction.js";

class ApiGqlClientImpl implements ApiGqlClientAbstraction.Interface {
    constructor(
        private apiStackOutputService: ApiStackOutputService.Interface,
        private invokeLambdaFunction: InvokeLambdaFunction.Interface
    ) {}

    async query<T = any>(params: {
        query: string;
        variables?: Record<string, any>;
    }): Promise<ApiGqlClientAbstraction.Response<T>> {
        return this.executeGraphQL({
            query: params.query,
            variables: params.variables
        });
    }

    async mutation<T = any>(params: {
        mutation: string;
        variables?: Record<string, any>;
    }): Promise<ApiGqlClientAbstraction.Response<T>> {
        return this.executeGraphQL({
            query: params.mutation,
            variables: params.variables
        });
    }

    private async executeGraphQL(params: {
        query: string;
        variables?: Record<string, any>;
    }): Promise<ApiGqlClientAbstraction.Response> {
        // Get GraphQL Lambda function name from API stack output
        const stackOutput = await this.apiStackOutputService.execute<{
            graphqlLambdaName: string;
        }>();

        if (!stackOutput) {
            throw new Error("Could not retrieve API stack output for GraphQL client.");
        }

        const { graphqlLambdaName } = stackOutput;

        // Invoke Lambda with API Gateway event format
        const result = await this.invokeLambdaFunction.execute({
            functionName: graphqlLambdaName,
            payload: {
                path: "/graphql",
                httpMethod: "POST",
                headers: {
                    "x-tenant": "root",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: params.query,
                    variables: params.variables
                })
            }
        });

        // Parse Lambda response (API Gateway format)
        const lambdaResponse = result.payload;
        const graphqlResponse = JSON.parse(lambdaResponse.body);

        return graphqlResponse;
    }
}

export const ApiGqlClient = ApiGqlClientAbstraction.createImplementation({
    implementation: ApiGqlClientImpl,
    dependencies: [ApiStackOutputService, InvokeLambdaFunction]
});
