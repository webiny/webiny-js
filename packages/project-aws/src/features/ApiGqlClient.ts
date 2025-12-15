import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { ApiGqlClient as ApiGqlClientAbstraction  } from "~/abstractions/ApiGqlClient.js";
import { InvokeLambdaFunction } from "~/abstractions/InvokeLambdaFunction.js";

class ApiGqlClientImpl implements ApiGqlClientAbstraction.Interface {
    constructor(
        private getAppStackOutput: GetAppStackOutput.Interface,
        private invokeLambdaFunction: InvokeLambdaFunction.Interface
    ) {}

    async query<T = any>(params: ApiGqlClientAbstraction.QueryParams): Promise<ApiGqlClientAbstraction.Response<T>> {
        return this.executeGraphQL({
            query: params.query,
            variables: params.variables
        });
    }

    async mutation<T = any>(
        params: ApiGqlClientAbstraction.MutationParams
    ): Promise<ApiGqlClientAbstraction.Response<T>> {
        return this.executeGraphQL({
            query: params.mutation,
            variables: params.variables
        });
    }

    private async executeGraphQL(params: {
        query: string;
        variables?: Record<string, any>;
    }): Promise<ApiGqlClientAbstraction.Response> {
        // Get GraphQL Lambda function name from stack output
        const stackOutput = await this.getAppStackOutput.execute<{ graphqlLambdaName: string }>({
            app: "api",
            env: "dev"
            // variant: ''
        });

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
    dependencies: [GetAppStackOutput, InvokeLambdaFunction]
});
