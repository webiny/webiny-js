import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListPageBlocks(): Promise<[{ id: string; name: string }]>;
        }
    }
}

const QUERY = /* GraphQL */ `
    query ListPageBlocks {
        pageBuilder {
            listPageBlocks {
                data {
                    id
                    name
                }
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

Cypress.Commands.add("pbListPageBlocks", () => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.listPageBlocks.data);
    });
});
