import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { Redirect } from "~/domain/Redirect/Redirect.js";
import { REDIRECT_FIELDS } from "~/features/redirects/shared/graphqlFields.js";
import {
    CreateRedirectGateway as GatewayAbstraction,
    type CreateRedirectGatewayParams
} from "./abstractions.js";

const CREATE_REDIRECT = /* GraphQL */ `
    mutation CreateRedirect($data: WbRedirectCreateInput!) {
        websiteBuilder {
            createRedirect(data: $data) {
                data {
                    ${REDIRECT_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

interface CreateRedirectResponse {
    websiteBuilder: {
        createRedirect: {
            data: Record<string, unknown> | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class CreateRedirectGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: CreateRedirectGatewayParams): Promise<Redirect> {
        const response = await this.client.execute<CreateRedirectResponse>({
            query: CREATE_REDIRECT,
            variables: {
                data: {
                    location: params.location,
                    redirectFrom: params.redirectFrom,
                    redirectTo: params.redirectTo,
                    redirectType: params.redirectType,
                    isEnabled: params.isEnabled
                }
            }
        });

        const envelope = response.websiteBuilder.createRedirect;

        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not create redirect.");
        }

        return Redirect.create(envelope.data!);
    }
}

export const CreateRedirectGateway = GatewayAbstraction.createImplementation({
    implementation: CreateRedirectGatewayImpl,
    dependencies: [MainGraphQLClient]
});
