import { gqlClient } from "../utils";

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
            return Promise.all(
                categories.map(category => {
                    return gqlClient
                        .request({
                            query: MUTATION,
                            variables: { slug: category.slug },
                            authToken: user.idToken.jwtToken
                        })
                        .then(response => response.pageBuilder.deleteBlockCategory);
                })
            );
        });
    });
});
