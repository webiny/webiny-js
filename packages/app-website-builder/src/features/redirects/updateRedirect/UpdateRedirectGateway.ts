import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { Redirect } from "~/domain/Redirect/Redirect.js";
import { REDIRECT_FIELDS } from "~/features/redirects/shared/graphqlFields.js";
import {
    UpdateRedirectGateway as GatewayAbstraction,
    type UpdateRedirectParams
} from "./abstractions.js";

const UPDATE_REDIRECT = /* GraphQL */ `
    mutation UpdateRedirect($id: ID!, $data: WbRedirectUpdateInput!) {
        websiteBuilder {
            updateRedirect(id: $id, data: $data) {
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

interface UpdateRedirectResponse {
    websiteBuilder: {
        updateRedirect: {
            data: Record<string, unknown> | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class UpdateRedirectGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: UpdateRedirectParams): Promise<Redirect> {
        const response = await this.client.execute<UpdateRedirectResponse>({
            query: UPDATE_REDIRECT,
            variables: {
                id: params.id,
                data: {
                    redirectFrom: params.redirectFrom,
                    redirectTo: params.redirectTo,
                    redirectType: params.redirectType,
                    isEnabled: params.isEnabled
                }
            }
        });

        const envelope = response.websiteBuilder.updateRedirect;

        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not update redirect.");
        }

        return Redirect.create(envelope.data!);
    }
}

export const UpdateRedirectGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateRedirectGatewayImpl,
    dependencies: [MainGraphQLClient]
});
