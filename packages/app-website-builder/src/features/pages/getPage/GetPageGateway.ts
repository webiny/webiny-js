import {
    GetPageGateway as GatewayAbstraction,
    GetPageGraphQLFieldSelection
} from "./abstractions.js";
import type { IGetPageGraphQLFieldSelection } from "./abstractions.js";
import type { PageGatewayDto } from "./PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

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

        const extraFields = ["properties", "metadata", "bindings", "elements", "extensions"];
        for (const selection of this.fieldSelections) {
            extraFields.push(...selection.getSelection());
        }

        const fields = getPageGraphQLFields(extraFields);

        const query = /* GraphQL */ `
            query GetPage($id: ID!) {
                websiteBuilder {
                    getPageById(id: $id) {
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
