import { GraphQLClient } from "graphql-request";

Cypress.Commands.add("pbListPageBlocks", () => {
    return cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        const query = `
            query ListPageBlocks {
                pageBuilder {
                    listPageBlocks {
                        data {
                            id                        }
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

        return client.request(query).then(response => {
            const data = response.pageBuilder.listPageBlocks.data;
            return data;
        });
    });
});
