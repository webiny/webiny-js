import {
    GetPageGateway as GatewayAbstraction,
    GetPageGraphQLFieldSelection
} from "./abstractions.js";
import type { IGetPageGraphQLFieldSelection } from "./abstractions.js";
import type { PageGatewayDto } from "./PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import {
    getPageGraphQLFields,
    PAGE_LAYOUT_GRAPHQL_FIELDS
} from "~/features/pages/shared/pageGraphQLFields.js";

type GetPageResponse = {
    websiteBuilder: {
        getPageById:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class GetPageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private fieldSelections: IGetPageGraphQLFieldSelection[]
    ) {}

    async execute(id: string): Promise<PageGatewayDto> {
        if (!id) {
            throw new Error("Page `id` is mandatory");
        }

        const extraFields = [
            "properties",
            "metadata",
            "bindings",
            "elements",
            "extensions",
            PAGE_LAYOUT_GRAPHQL_FIELDS
        ];
        for (const selection of this.fieldSelections) {
            extraFields.push(...selection.getSelection());
        }

        const fields = getPageGraphQLFields(extraFields);

        // The page as stored: its own elements, and its overrides of global components and of its layout's
        // elements. The page editor composes them with the global components' records and the layout.

        const query = /* GraphQL */ `
            query GetPage($id: ID!) {
                websiteBuilder {
                    getPageById(id: $id, raw: true) {
                        data {
                            ${fields.join("\n")}
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

        const response = await this.client.execute<GetPageResponse>({
            query,
            variables: { id }
        });

        const envelope = response.websiteBuilder.getPageById;
        if (envelope.error) {
            throw new Error(envelope.error.message || `Could not fetch page with id: ${id}.`);
        }

        return envelope.data;
    }
}

export const GetPageGateway = GatewayAbstraction.createImplementation({
    implementation: GetPageGatewayImpl,
    dependencies: [MainGraphQLClient, [GetPageGraphQLFieldSelection, { multiple: true }]]
});
