import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { AuthenticationGateway as Abstraction } from "./abstractions.js";
import type { IdentityDTO } from "./types.js";
import { createLoginMutation } from "./createLoginMutation.js";

interface LoginMutationResponse {
    security: {
        login: {
            data: IdentityDTO;
            error: {
                message: string;
            };
        };
    };
}

class AuthenticationGatewayImpl implements Abstraction.Interface {
    constructor(private graphqlClient: GraphQLClient.Interface) {}

    async execute(identityType: string): Promise<IdentityDTO> {
        const response = await this.graphqlClient.execute<LoginMutationResponse>({
            query: createLoginMutation(identityType)
        });

        const { data, error } = response.security.login;

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

export const AuthenticationGateway = Abstraction.createImplementation({
    implementation: AuthenticationGatewayImpl,
    dependencies: [GraphQLClient]
});
