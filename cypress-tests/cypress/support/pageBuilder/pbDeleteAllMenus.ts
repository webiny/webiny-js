import { gqlClient } from "../utils";

const LIST_MENUS_QUERY = /* GraphQL */ `
    query listMenus {
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
                        __typename
                    }
                    __typename
                }
                __typename
            }
            __typename
        }
    }
`;

const DELETE_MENU_MUTATION = /* GraphQL */ `
    mutation deleteMenu($slug: String!) {
        pageBuilder {
            deleteMenu(slug: $slug) {
                error {
                    code
                    message
                    __typename
                }
                __typename
            }
        }
    }
`;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            listMenus(): Promise<Record<string, any>[]>;
            deleteMenu(slug: string): Promise<Record<string, any>>;
            pbDeleteAllMenus(): void;
        }
    }
}

Cypress.Commands.add("listMenus", () => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: LIST_MENUS_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.listMenus.data);
    });
});

Cypress.Commands.add("deleteMenu", slug => {
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

Cypress.Commands.add("pbDeleteAllMenus", () => {
    cy.listMenus().then(menus => {
        return Promise.all(
            menus.map(menu => {
                if (menu.slug !== "main-menu") {
                    return cy.deleteMenu(menu.slug);
                } else {
                    return Promise.resolve(); // Return a resolved promise to continue the Promise.all
                }
            })
        );
    });
});
