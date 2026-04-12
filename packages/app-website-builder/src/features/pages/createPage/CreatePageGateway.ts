import { CreatePageGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageDto } from "./PageDto.js";
import type { PageGqlDto } from "./PageGqlDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const CREATE_PAGE = /* GraphQL */ `
    mutation CreatePage($data: WbPageCreateInput!) {
        websiteBuilder {
            createPage(data: $data) {
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

type CreatePageResponse = {
    websiteBuilder: {
        createPage:
            | { data: PageGqlDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class CreatePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(page: PageDto): Promise<PageGqlDto> {
        const response = await this.client.execute<CreatePageResponse>({
            query: CREATE_PAGE,
            variables: { data: { ...page } }
        });

        const envelope = response.websiteBuilder.createPage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not create page.");
        }

        return envelope.data;
    }
}

export const CreatePageGateway = GatewayAbstraction.createImplementation({
    implementation: CreatePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
