import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeletePage(params: { id: string }): Promise<any>;
        }
    }
}

const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                error {
                    message
                    data
                    code
                }
            }
        }
    }
`;

Cypress.Commands.add("pbDeletePage", data => {
    return cy.login().then(user => {
        return gqlClient
            .request<any>({
                query: DELETE_PAGE,
                variables: data,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.deletePage);
    });
});
