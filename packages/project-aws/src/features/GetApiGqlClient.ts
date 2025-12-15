import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { GetApiGqlClient as GetApiGqlClientAbstraction  } from "~/abstractions/GetApiGqlClient.js";
import { InvokeLambdaFunction } from "~/abstractions/InvokeLambdaFunction.js";

class ApiGqlClientInstance implements GetApiGqlClientAbstraction.ClientInstance {
    constructor(
        private env: string,
        private variant: string | undefined,
        private executeGraphQL: (params: {
            query: string;
            variables?: Record<string, any>;
            env: string;
            variant?: string;
        }) => Promise<GetApiGqlClientAbstraction.Response>
    ) {}

    async query<T = any>(params: { query: string; variables?: Record<string, any> }): Promise<GetApiGqlClientAbstraction.Response<T>> {
        return this.executeGraphQL({
            query: params.query,
            variables: params.variables,
            env: this.env,
            variant: this.variant
        });
    }

    async mutation<T = any>(params: { mutation: string; variables?: Record<string, any> }): Promise<GetApiGqlClientAbstraction.Response<T>> {
        return this.executeGraphQL({
            query: params.mutation,
            variables: params.variables,
            env: this.env,
            variant: this.variant
        });
    }
}

class GetApiGqlClientImpl implements GetApiGqlClientAbstraction.Interface {
    constructor(
        private getAppStackOutput: GetAppStackOutput.Interface,
        private invokeLambdaFunction: InvokeLambdaFunction.Interface
    ) {}

    async execute(params: { env: string; variant?: string }): Promise<GetApiGqlClientAbstraction.ClientInstance> {
        return new ApiGqlClientInstance(
            params.env,
            params.variant,
            this.executeGraphQL.bind(this)
        );
    }

    private async executeGraphQL(params: {
        query: string;
        variables?: Record<string, any>;
        env: string;
        variant?: string;
    }): Promise<GetApiGqlClientAbstraction.Response> {
        // Get GraphQL Lambda function name from stack output
        const stackOutput = await this.getAppStackOutput.execute<{ graphqlLambdaName: string }>({
            app: "api",
            env: params.env,
            variant: params.variant
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

export const GetApiGqlClient = GetApiGqlClientAbstraction.createImplementation({
    implementation: GetApiGqlClientImpl,
    dependencies: [GetAppStackOutput, InvokeLambdaFunction]
});
