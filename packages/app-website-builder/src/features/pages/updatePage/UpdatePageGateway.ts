import { UpdatePageGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageDto } from "./PageDto.js";
import type { PageGqlDto } from "./PageGqlDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: WbPageUpdateInput!) {
        websiteBuilder {
            updatePage(id: $id, data: $data) {
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

type UpdatePageResponse = {
    websiteBuilder: {
        updatePage:
            | { data: PageGqlDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdatePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(page: PageDto): Promise<PageGqlDto> {
        const { id, properties, metadata, elements, bindings, extensions } = page;

        const response = await this.client.execute<UpdatePageResponse>({
            query: UPDATE_PAGE,
            variables: {
                id,
                data: {
                    properties,
                    metadata,
                    elements,
                    bindings,
                    extensions
                }
            }
        });

        const envelope = response.websiteBuilder.updatePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not update page.");
        }

        return envelope.data;
    }
}

export const UpdatePageGateway = GatewayAbstraction.createImplementation({
    implementation: UpdatePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
