import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { ListPagesGateway } from "~/features/pages/listPages/abstractions.js";
import { LayoutError } from "../shared/errors.js";
import {
    type LayoutPreviewPage,
    LayoutPreviewPagesGateway as GatewayAbstraction
} from "./abstractions.js";

// Enough to pick from: the most recently saved pages.
const PAGES_LIMIT = 200;

// Without `raw`, the page is delivered composed: with its global components and overrides merged.
const GET_PAGE = /* GraphQL */ `
    query GetLayoutPreviewPage($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
                data {
                    id
                    properties
                    elements
                    bindings
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type GetPageResponse = {
    websiteBuilder: {
        getPageById:
            | { data: Partial<LayoutPreviewPage> & { id: string }; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class LayoutPreviewPagesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private listPagesGateway: ListPagesGateway.Interface,
        private client: MainGraphQLClient.Interface
    ) {}

    async listPages() {
        const { data } = await this.listPagesGateway.execute({
            limit: PAGES_LIMIT,
            sort: ["savedOn_DESC"]
        });

        return data.map(page => ({
            id: page.id,
            title: String(page.properties?.title ?? ""),
            path: String(page.properties?.path ?? ""),
            language: page.properties?.language ?? null
        }));
    }

    async getPage(id: string) {
        const response = await this.client.execute<GetPageResponse>({
            query: GET_PAGE,
            variables: { id }
        });

        const envelope = response.websiteBuilder.getPageById;
        if (envelope.error || !envelope.data) {
            throw new LayoutError({
                message: envelope.error?.message || `Could not load page "${id}".`,
                code: envelope.error?.code,
                data: envelope.error?.data
            });
        }

        const page = envelope.data;
        return {
            id: page.id,
            properties: page.properties ?? {},
            elements: page.elements ?? {},
            bindings: page.bindings ?? {}
        };
    }
}

export const LayoutPreviewPagesGateway = GatewayAbstraction.createImplementation({
    implementation: LayoutPreviewPagesGatewayImpl,
    dependencies: [ListPagesGateway, MainGraphQLClient]
});
