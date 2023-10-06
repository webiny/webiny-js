import { GraphQLClient } from "graphql-request";

interface CreateCategoryAndBlocksParams {
    blockCategory: Record<string, any>;
    blockNames: string[];
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreateCategoryAndBlocks(params: CreateCategoryAndBlocksParams): Promise<Array<{}>>;
        }
    }
}

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

Cypress.Commands.add("pbCreateCategoryAndBlocks", ({ blockCategory, blockNames }) => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        const createCategoryPromise = client
            .request(CREATE_BLOCK_CATEGORY_MUTATION, { data: blockCategory })
            .then(response => response.pageBuilder.blockCategory.data);

        return createCategoryPromise.then(categoryData => {
            const categorySlug = categoryData.slug;

            const createBlocksPromises: Array<Promise<{ id: string; name: string }>> = [];
            blockNames.forEach(blockName => {
                createBlocksPromises.push(
                    client.request(CRATE_BLOCK_MUTATION, {
                        data: {
                            name: blockName,
                            blockCategory: categorySlug,
                            content: {
                                id: "xyz",
                                type: "block",
                                data: {},
                                elements: []
                            }
                        }
                    })
                );
            });

            return Promise.all(createBlocksPromises);
        });
    });
});
