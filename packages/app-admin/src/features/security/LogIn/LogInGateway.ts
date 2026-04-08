import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { LogInGateway as Abstraction, LogInRepository } from "./abstractions.js";
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
    constructor(private graphqlClient: MainGraphQLClient.Interface) {}

    async execute(): Promise<LogInRepository.IdentityDTO> {
        const response = await this.graphqlClient.execute<LoginMutationResponse>({
            query: createLoginMutation()
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
    dependencies: [MainGraphQLClient]
});
