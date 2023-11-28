// listMenus.js
import { gqlClient } from "../utils";

const LIST_MENUS_QUERY = /* GraphQL */ `
    query pbListMenus {
        pageBuilder {
            listMenus {
                data {
                    title
                    slug
                    description
                    items
                    createdOn
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
            pbListMenus(): Promise<Record<string, any>[]>;
        }
    }
}

Cypress.Commands.add("pbListMenus", () => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: LIST_MENUS_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.listMenus.data);
    });
});
