import { GraphQLClient } from "graphql-request";

Cypress.Commands.add("pbDeleteBlocks", () => {
    cy.pbListPageBlocks().then(ids => {
        cy.login().then(user => {
            const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
                headers: {
                    authorization: `Bearer ${user.idToken.jwtToken}`
                }
            });

            const mutation = `
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

            return Promise.all(
                ids.map(id => {
                    const variables = {
                        id: id
                    };

                    return client
                        .request(mutation, variables)
                        .then(response => response.pageBuilder.deletePageBlock);
                })
            );
        });
    });
});
