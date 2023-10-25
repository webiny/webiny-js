import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListBlockCategories(): Promise<Array<{ slug: string; name: string }>>;
        }
    }
}

const QUERY = /* GraphQL */ `
    query ListBlockCategories {
        pageBuilder {
            listBlockCategories {
                data {
                    slug
                    name
                }
            }
        }
    }
`;

Cypress.Commands.add("pbListBlockCategories", () => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.listBlockCategories.data);
    });
});
