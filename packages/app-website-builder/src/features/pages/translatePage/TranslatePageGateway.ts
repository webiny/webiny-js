import { TranslatePageGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

const TRANSLATE_PAGE = /* GraphQL */ `
    mutation TranslatePage($pageId: ID!, $languageCode: String!, $folderId: ID!) {
        websiteBuilder {
            translatePage(pageId: $pageId, languageCode: $languageCode, folderId: $folderId) {
                data {
                    id
                    entryId
                    properties {
                        title
                        path
                        language
                    }
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

type TranslatePageResponse = {
    websiteBuilder: {
        translatePage:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class TranslatePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: GatewayAbstraction.Interface["execute"] extends (p: infer P) => any ? P : never): Promise<PageGatewayDto> {
        const response = await this.client.execute<TranslatePageResponse>({
            query: TRANSLATE_PAGE,
            variables: {
                pageId: params.pageId,
                languageCode: params.languageCode,
                folderId: params.folderId
            }
        });

        const envelope = response.websiteBuilder.translatePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not translate page.");
        }

        return envelope.data;
    }
}

export const TranslatePageGateway = GatewayAbstraction.createImplementation({
    implementation: TranslatePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
