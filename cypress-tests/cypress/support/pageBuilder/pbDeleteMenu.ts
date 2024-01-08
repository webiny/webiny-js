import { gqlClient } from "../utils";

const DELETE_MENU_MUTATION = /* GraphQL */ `
    mutation deleteMenu($slug: String!) {
        pageBuilder {
            deleteMenu(slug: $slug) {
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
            pbDeleteMenu(slug: string): Promise<Record<string, any>>;
        }
    }
}

Cypress.Commands.add("pbDeleteMenu", slug => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: DELETE_MENU_MUTATION,
                variables: { slug },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.deleteMenu);
    });
});
