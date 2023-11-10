// Corrected pbClearMainMenu.ts

import { gqlClient } from "../utils";

declare global {
  namespace Cypress {
    interface Chainable {
      pbClearMainMenu(): Chainable<Promise<any>>;
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
          createdOn
          createdBy {
            id
            displayName
            __typename
          }
          __typename
        }
        error {
          code
          message
          data
          __typename
        }
        __typename
      }
      __typename
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
      items: [],
    },
  };

  return cy.login().then((user) => {
    return gqlClient.request({
      query: CLEAR_MAIN_MENU,
      variables, // No comma needed here
      authToken: user.idToken.jwtToken,
    }).then((response) => {
      // Handle the response as needed
      if (response.pageBuilder.menu.error) {
        throw new Error(`Failed to clear menu items: ${response.pageBuilder.menu.error.message}`);
      }

      return response.pageBuilder.menu.data;
    });
  });
});
