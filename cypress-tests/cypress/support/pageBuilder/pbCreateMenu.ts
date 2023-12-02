import { gqlClient } from "../utils";

const CREATE_MENU = /* GraphQL */ `
    mutation CreateMenu($data: PbMenuInput!) {
        pageBuilder {
            menu: createMenu(data: $data) {
                data {
                    title
                    slug
                    description
                    items
                }
            }
        }
    }
`;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreateMenu(
                data: any
            ): Promise<{ title: string; slug: string; description: string; items: any[] }>;
        }
    }
}

Cypress.Commands.add("pbCreateMenu", variables => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: CREATE_MENU,
                variables,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.menu.data);
    });
});
