import { PublishPageGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        websiteBuilder {
            publishPage(id: $id) {
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

type PublishPageResponse = {
    websiteBuilder: {
        publishPage:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class PublishPageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<PageGatewayDto> {
        const response = await this.client.execute<PublishPageResponse>({
            query: PUBLISH_PAGE,
            variables: { id }
        });

        const envelope = response.websiteBuilder.publishPage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not publish page.");
        }

        return envelope.data;
    }
}

export const PublishPageGateway = GatewayAbstraction.createImplementation({
    implementation: PublishPageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
