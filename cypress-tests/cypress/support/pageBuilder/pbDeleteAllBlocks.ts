import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeleteAllBlocks(): Promise<Record<string, any>[]>;
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
                }
            }
        }
    }
`;

Cypress.Commands.add("pbDeleteAllBlocks", () => {
    // Use pbListPageBlocks to get an array of page blocks
    cy.pbListPageBlocks().then(pageBlocks => {
        cy.login().then(user => {
            // Use Promise.all to map and execute the deletePageBlock mutation for each page block
            return Promise.all(
                pageBlocks.map(pageBlock => {
                    const variables = {
                        id: pageBlock.id // Assuming the page block object has an 'id' property
                    };

                    return gqlClient
                        .request({
                            query: MUTATION,
                            variables,
                            authToken: user.idToken.jwtToken
                        })
                        .then(response => response.pageBuilder.deletePageBlock);
                })
            );
        });
    });
});
