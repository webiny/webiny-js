import { GraphQLClient } from "graphql-request";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListBlockCategories(): Promise<Array<{ slug: string; name: string }>>;
        }
    }
}

const QUERY = /* GraphQL */ `
    query ListBlockCategories {
        pageBuilder {
            listBlockCategories {
                data {
                    slug
                    name
                }
            }
        }
    }
`;

Cypress.Commands.add("pbListBlockCategories", () => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client.request(QUERY).then(response => {
            return response.pageBuilder.listBlockCategories.data;
        });
    });
});
