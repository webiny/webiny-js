import { GraphQLClient } from "graphql-request";

Cypress.Commands.add("pbDeleteBlockCategories", () => {
    cy.pbListBlockCategories().then(categories => {
        cy.login().then(user => {
            const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
                headers: {
                    authorization: `Bearer ${user.idToken.jwtToken}`
                }
            });

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
