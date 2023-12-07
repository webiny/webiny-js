import { gqlClient } from "../utils";

const CREATE_PAGE = /* GraphQL */ `
    mutation PbCreatePage($from: ID, $category: String, $meta: JSON) {
        pageBuilder {
            createPage(from: $from, category: $category, meta: $meta) {
                data {
                    id
                    title
                    category {
                        name
                        slug
                    }
                }
            }
        }
    }
`;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreatePage(data: any): Promise<{ id: string; title: string; category: string[] }>;
        }
    }
}
Cypress.Commands.add("pbCreatePage", variables => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: CREATE_PAGE,
                variables,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.createPage.data);
    });
});
