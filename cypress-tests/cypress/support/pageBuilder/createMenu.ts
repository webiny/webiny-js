import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreateMenu(data: any): Promise<any>; // Update the data type as needed
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation CreateMenu($data: PbMenuInput!) {
        pageBuilder {
            menu: createMenu(data: $data) {
                data {
                    title
                    slug
                    description
                    items
                    createdOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
            }
        }
    }
`;

Cypress.Commands.add("pbCreateMenu", data => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: MUTATION,
                variables: {
                    data
                },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.menu);
    });
});
