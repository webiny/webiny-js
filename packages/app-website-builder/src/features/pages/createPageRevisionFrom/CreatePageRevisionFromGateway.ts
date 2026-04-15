import { CreatePageRevisionFromGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const CREATE_PAGE_REVISION_FROM = /* GraphQL */ `
    mutation CreatePageRevisionFrom($id: ID!) {
        websiteBuilder {
            createPageRevisionFrom(id: $id) {
                data {
                    ${getPageGraphQLFields(["properties", "metadata", "bindings", "elements", "extensions"]).join("\n")}
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

type CreatePageRevisionFromResponse = {
    websiteBuilder: {
        createPageRevisionFrom:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class CreatePageRevisionFromGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<PageGatewayDto> {
        const response = await this.client.execute<CreatePageRevisionFromResponse>({
            query: CREATE_PAGE_REVISION_FROM,
            variables: { id }
        });

        const envelope = response.websiteBuilder.createPageRevisionFrom;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not create page revision.");
        }

        return envelope.data;
    }
}

export const CreatePageRevisionFromGateway = GatewayAbstraction.createImplementation({
    implementation: CreatePageRevisionFromGatewayImpl,
    dependencies: [MainGraphQLClient]
});
