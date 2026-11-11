import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { pageMocks } from "./mocks/page.mock.js";

const TRANSLATE_PAGE = /* GraphQL */ `
    mutation TranslatePage($pageId: ID!, $languageCode: String!, $folderId: ID!) {
        websiteBuilder {
            translatePage(pageId: $pageId, languageCode: $languageCode, folderId: $folderId) {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

describe("translatePage mutation", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    beforeEach(async () => {
        // The default test license has multi-tenancy, which licenses languages, but no AI Powerups.
        handler = useGraphQlHandler({});
    });

    it("should reach the translate use case without the AI page translation license", async () => {
        const [createResponse] = await handler.wb.createPage({
            data: pageMocks.pageA
        });
        const page = createResponse.data.websiteBuilder.createPage.data;

        const [response] = await handler.invoke({
            body: {
                query: TRANSLATE_PAGE,
                variables: { pageId: page.id, languageCode: "xx", folderId: "xx-folder" }
            }
        });

        // An unknown language proves the use case ran; a license check would have thrown first.
        expect(response.data.websiteBuilder.translatePage.data).toBeNull();
        expect(response.data.websiteBuilder.translatePage.error.message).toBe(
            `Language "xx" was not found.`
        );
    });
});
