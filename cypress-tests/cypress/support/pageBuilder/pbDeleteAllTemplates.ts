import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            // Combined method to list and delete all templates
            pbDeleteAllTemplates(): Promise<void[]>;
        }
    }
}

const LIST_QUERY = /* GraphQL */ `
    query ListPageTemplates {
        pageBuilder {
            listPageTemplates {
                data {
                    id
                }
            }
        }
    }
`;

const DELETE_MUTATION = /* GraphQL */ `
    mutation DeletePageTemplate($id: ID!) {
        pageBuilder {
            deletePageTemplate(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

Cypress.Commands.add("pbDeleteAllTemplates", () => {
    return cy.login().then(user => {
        // First, list all page templates.
        return gqlClient
            .request({
                query: LIST_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(async listResponse => {
                const templates = listResponse.pageBuilder.listPageTemplates.data;

                // Loop through the templates and delete each one.
                return Promise.all(
                    templates.map(async (template: { id: string }) => {
                        await gqlClient.request({
                            query: DELETE_MUTATION,
                            variables: {
                                id: template.id
                            },
                            authToken: user.idToken.jwtToken
                        });
                    })
                );
            });
    });
});
