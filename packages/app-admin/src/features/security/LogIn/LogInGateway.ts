import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { LogInGateway as Abstraction, LogInRepository } from "./abstractions.js";
import { createLoginMutation } from "./createLoginMutation.js";
import { LogInError } from "./LogInError.js";

interface LoginMutationResponse {
    security: {
        login: {
            data: LogInRepository.IdentityDTO;
            error: {
                code: string;
                message: string;
                data: Record<string, any> | null;
            };
        };
    };
}

class LogInGatewayImpl implements Abstraction.Interface {
    constructor(private graphqlClient: MainGraphQLClient.Interface) {}

    async execute(): Promise<LogInRepository.IdentityDTO> {
        let response: LoginMutationResponse;
        try {
            response = await this.graphqlClient.execute<LoginMutationResponse>({
                query: createLoginMutation()
            });
        } catch (error) {
            throw LogInError.from(error);
        }

        const { data, error } = response.security.login;

        if (error) {
            throw new LogInError(error);
        }

        return data;
    }
}

export const LogInGateway = Abstraction.createImplementation({
    implementation: LogInGatewayImpl,
    dependencies: [MainGraphQLClient]
});
