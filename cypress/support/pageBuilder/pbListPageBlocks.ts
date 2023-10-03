import { GraphQLClient } from "graphql-request";

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
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client.request<Record<string, any>>(QUERY).then(response => {
            return response.pageBuilder.listPageBlocks.data;
        });
    });
});
