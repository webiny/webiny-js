import { gqlClient } from "../utils";
import { createHeadingBlock } from "./pbCreateCategoryAndBlocks/createHeadingBlock";
interface CreateCategoryAndBlocksParams {
    blockCategory: Record<string, any>;
    blockNames: string[];
    content?: Content;
}

type Content = {
    type: "heading";
    text: string;
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreateCategoryAndBlocks(
                params: CreateCategoryAndBlocksParams
            ): Promise<Array<Record<string, any>>>;
        }
    }
}

const contentData = (contentText: string, contentType: string) => {
    switch (contentType) {
        case "heading":
            return {
                type: "block",
                data: {},
                elements: [createHeadingBlock(contentText)]
            };

        default:
            return {};
    }
};

const CREATE_BLOCK_CATEGORY_MUTATION = /* GraphQL */ `
    mutation CreateBlockCategory($data: PbBlockCategoryInput!) {
        pageBuilder {
            blockCategory: createBlockCategory(data: $data) {
                data {
                    slug
                    name
                    icon
                    description
                    createdOn
                    createdBy {
                        id
                        displayName
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

const CRATE_BLOCK_MUTATION = /* GraphQL */ `
    mutation CreatePageBlock($data: PbCreatePageBlockInput!) {
        pageBuilder {
            pageBlock: createPageBlock(data: $data) {
                data {
                    id
                    blockCategory
                    name
                    content
                    createdOn
                    createdBy {
                        id
                        displayName
                        type
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

Cypress.Commands.add("pbCreateCategoryAndBlocks", ({ blockCategory, blockNames, content }) => {
    cy.login().then(user => {
        const createCategoryPromise = gqlClient
            .request({
                query: CREATE_BLOCK_CATEGORY_MUTATION,
                variables: { data: blockCategory },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.blockCategory.data);

        return createCategoryPromise.then(categoryData => {
            const categorySlug = categoryData.slug;

            const createBlocksPromises: Array<Promise<{ id: string; name: string }>> = [];
            blockNames.forEach(blockName => {
                createBlocksPromises.push(
                    gqlClient.request({
                        query: CRATE_BLOCK_MUTATION,
                        variables: {
                            id: "xyz",
                            data: {
                                name: blockName,
                                blockCategory: categorySlug,
                                content: content ? contentData(content.text, content.type) : {}
                            }
                        },
                        authToken: user.idToken.jwtToken
                    })
                );
            });

            return Promise.all(createBlocksPromises);
        });
    });
});
