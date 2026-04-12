import { DuplicatePageGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const DUPLICATE_PAGE = /* GraphQL */ `
    mutation DuplicatePage($id: ID!) {
        websiteBuilder {
            duplicatePage(id: $id) {
                data {
                    ${getPageGraphQLFields(["properties", "metadata"]).join("\n")}
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

type DuplicatePageResponse = {
    websiteBuilder: {
        duplicatePage:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class DuplicatePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<PageGatewayDto> {
        const response = await this.client.execute<DuplicatePageResponse>({
            query: DUPLICATE_PAGE,
            variables: { id }
        });

        const envelope = response.websiteBuilder.duplicatePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not duplicate page.");
        }

        return envelope.data;
    }
}

export const DuplicatePageGateway = GatewayAbstraction.createImplementation({
    implementation: DuplicatePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
