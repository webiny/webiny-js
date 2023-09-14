import { GraphQLClient } from "graphql-request";

const mutation = `
                mutation DeleteBlockCategory($slug: String!) {
                    pageBuilder {
                        deleteBlockCategory(slug: $slug) {
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

Cypress.Commands.add("pbAllDeleteBlockCategories", () => {
    cy.pbListBlockCategories().then(categories => {
        cy.login().then(user => {
            const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
                headers: {
                    authorization: `Bearer ${user.idToken.jwtToken}`
                }
            });

            return Promise.all(
                categories.map(category => {
                    const variables = {
                        slug: category.slug
                    };

                    return client
                        .request(mutation, variables)
                        .then(response => response.pageBuilder.deleteBlockCategory);
                })
            );
        });
    });
});
