import { GraphQLClient } from "graphql-request";
import { customAlphabet } from "nanoid";

const createCategoryMutation = /* GraphQL */ `
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

const createBlockMutation = /* GraphQL */ `
    mutation CreatePageBlock($data: PbCreatePageBlockInput!) {
        pageBuilder {
            pageBlock: createPageBlock(data: $data) {
                data {
                    id
                    blockCategory
                    preview
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

Cypress.Commands.add("pbCreateCategoryAndBlocks", (categoryVariables, numBlocks) => {
    cy.login().then(user => {
        const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        const createCategoryPromise = client
            .request(createCategoryMutation, { data: categoryVariables })
            .then(response => response.pageBuilder.blockCategory.data);

        return createCategoryPromise.then(categoryData => {
            const categorySlug = categoryData.slug;

            const createBlocksPromises = [];

            for (let i = 0; i < numBlocks; i++) {
                const blockVariables = {
                    name: nanoid(10).toLowerCase(),
                    content: {},
                    preview: {}
                };

                const blockData = {
                    ...blockVariables,
                    blockCategory: categorySlug
                };

                createBlocksPromises.push(client.request(createBlockMutation, { data: blockData }));
            }

            return Promise.all(createBlocksPromises);
        });
    });
});
