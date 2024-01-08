// Corrected pbClearMainMenu.ts

import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbClearMainMenu(): Chainable<
                Promise<{ title: string; slug: string; description: string; items: string[] }>
            >;
        }
    }
}

// GraphQL mutation to clear menu items
const CLEAR_MAIN_MENU = `
  mutation updateMenu($slug: String!, $data: PbMenuInput!) {
    pageBuilder {
      menu: updateMenu(slug: $slug, data: $data) {
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

Cypress.Commands.add("pbClearMainMenu", () => {
    const variables = {
        slug: "main-menu",
        data: {
            slug: "main-menu",
            title: "Main Menu",
            description: "Main Menu description",
            items: []
        }
    };

    cy.login().then(user => {
        return gqlClient
            .request({
                query: CLEAR_MAIN_MENU,
                variables, // No comma needed here
                authToken: user.idToken.jwtToken
            })
            .then(response => {
                // Handle the response as needed
                if (response.pageBuilder.menu.error) {
                    throw new Error(
                        `Failed to clear menu items: ${response.pageBuilder.menu.error.message}`
                    );
                }

                return response.pageBuilder.menu.data;
            });
    });
});
