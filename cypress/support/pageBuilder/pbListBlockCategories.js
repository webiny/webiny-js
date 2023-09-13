import { GraphQLClient } from "graphql-request";

Cypress.Commands.add("pbListBlockCategories", () => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        const query = `
            query ListBlockCategories {
                pageBuilder {
                    listBlockCategories {
                        data {
                            slug
                        }
                    }
                }
            }
        `;

        return client.request(query).then(response => {
            return response.pageBuilder.listBlockCategories.data;
        });
    });
});
