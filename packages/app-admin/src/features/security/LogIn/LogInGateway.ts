import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import {
    LogInGateway as Abstraction,
    LoginGraphQLFieldSelection,
    LogInRepository
} from "./abstractions.js";
import { createLoginMutation } from "./createLoginMutation.js";

interface LoginMutationResponse {
    security: {
        login: {
            data: LogInRepository.IdentityDTO;
            error: {
                message: string;
            };
        };
    };
}

class LogInGatewayImpl implements Abstraction.Interface {
    constructor(
        private graphqlClient: GraphQLClient.Interface,
        private fieldSelection: LoginGraphQLFieldSelection.Interface
    ) {}

    async execute(identityType: string): Promise<LogInRepository.IdentityDTO> {
        const response = await this.graphqlClient.execute<LoginMutationResponse>({
            query: createLoginMutation(identityType, this.fieldSelection.getSelection())
        });

        const { data, error } = response.security.login;

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

export const LogInGateway = Abstraction.createImplementation({
    implementation: LogInGatewayImpl,
    dependencies: [GraphQLClient, LoginGraphQLFieldSelection]
});
