import { GraphQLClient } from "graphql-request";

declare global {
    namespace Cypress {
        interface Chainable {
            pbListAllCategories(): Promise<Array<{ slug: string; name: string; layout: string; url: string; createdOn: string; createdBy: { id: string; displayName: string } }>>;
        }
    }
}

const QUERY = /* GraphQL */ `
    query ListCategories {
        pageBuilder {
            listCategories {
                data {
                    slug
                    name
                    layout
                    url
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

Cypress.Commands.add("pbListAllCategories", () => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client.request(QUERY).then(response => {
            return response.pageBuilder.listCategories.data;
        });
    });
});
