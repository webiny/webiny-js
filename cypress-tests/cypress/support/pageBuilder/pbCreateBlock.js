import { GraphQLClient } from "graphql-request";

const createBlockMutation = /* GraphQL */ `
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

Cypress.Commands.add("pbCreateBlock", (blockVariables, categorySlug) => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(createBlockMutation, {
                ...blockVariables,
                blockCategory: categorySlug
            })
            .then(response => response.pageBuilder.pageBlock.data);
    });
});
