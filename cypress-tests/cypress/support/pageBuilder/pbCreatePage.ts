import { gqlClient } from "../utils";

const CREATE_PAGE = /* GraphQL */ `
    mutation PbCreatePage($from: ID, $category: String, $meta: JSON) {
        pageBuilder {
            createPage(from: $from, category: $category, meta: $meta) {
                data {
                    id
                    pid
                    status
                    title
                    version
                    savedOn
                    category {
                        name
                        slug
                    }
                    createdBy {
                        id
                        displayName
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
            pbCreatePage(data: any): Promise<any>;
        }
    }
}
Cypress.Commands.add("pbCreatePage", variables => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: CREATE_PAGE,
                variables,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.createPage.data);
    });
});
