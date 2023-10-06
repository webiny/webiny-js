import { GraphQLClient } from "graphql-request";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeleteBlocks(): Record<string, any>;
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation DeletePageBlock($id: ID!) {
        pageBuilder {
            deletePageBlock(id: $id) {
                error {
                    code
                    message
                    __typename
                }
                __typename
            }
        }
    }
`;

Cypress.Commands.add("pbDeleteBlocks", () => {
    // Use pbListPageBlocks to get an array of page blocks
    cy.pbListPageBlocks().then(pageBlocks => {
        cy.login().then(user => {
            const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
                headers: {
                    authorization: `Bearer ${user.idToken.jwtToken}`
                }
            });

            // Use Promise.all to map and execute the deletePageBlock mutation for each page block
            return Promise.all(
                pageBlocks.map(pageBlock => {
                    const variables = {
                        id: pageBlock.id // Assuming the page block object has an 'id' property
                    };

                    return client
                        .request(MUTATION, variables)
                        .then(response => response.pageBuilder.deletePageBlock);
                })
            );
        });
    });
});
