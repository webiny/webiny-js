import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { Tenant } from "~/features/tenancy/abstractions.js";
import { LogInGateway as Abstraction, LogInRepository } from "./abstractions.js";
import { createLoginMutation } from "./createLoginMutation.js";
import { LogInError } from "./LogInError.js";

type LoginResultDTO =
    | ({ __typename: "SecurityIdentity" } & LogInRepository.IdentityDTO)
    | { __typename: "SecurityLoginTenantSelection"; tenants: Tenant[] };

interface LoginMutationResponse {
    security: {
        login: {
            data: LoginResultDTO | null;
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

    async execute(): Promise<Abstraction.Result> {
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

        if (!data) {
            throw new LogInError({ message: "Login returned no identity." });
        }

        if (data.__typename === "SecurityLoginTenantSelection") {
            return { step: "selectTenant", tenants: data.tenants };
        }

        const { __typename, ...identity } = data;
        return { step: "done", identity };
    }
}

export const LogInGateway = Abstraction.createImplementation({
    implementation: LogInGatewayImpl,
    dependencies: [MainGraphQLClient]
});
