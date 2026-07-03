import { UnpublishPageGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        websiteBuilder {
            unpublishPage(id: $id) {
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

type UnpublishPageResponse = {
    websiteBuilder: {
        unpublishPage:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UnpublishPageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<PageGatewayDto> {
        const response = await this.client.execute<UnpublishPageResponse>({
            query: UNPUBLISH_PAGE,
            variables: { id }
        });

        const envelope = response.websiteBuilder.unpublishPage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not unpublish page.");
        }

        return envelope.data;
    }
}

export const UnpublishPageGateway = GatewayAbstraction.createImplementation({
    implementation: UnpublishPageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
