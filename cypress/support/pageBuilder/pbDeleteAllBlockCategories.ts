import { GraphQLClient } from "graphql-request";

const MUTATION = /* GraphQL */ `
    mutation DeleteBlockCategory($slug: String!) {
        pageBuilder {
            deleteBlockCategory(slug: $slug) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeleteAllBlockCategories(): Promise<Record<string, any>>;
        }
    }
}

Cypress.Commands.add("pbDeleteAllBlockCategories", () => {
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
                        .request(MUTATION, variables)
                        .then(response => response.pageBuilder.deleteBlockCategory);
                })
            );
        });
    });
});
