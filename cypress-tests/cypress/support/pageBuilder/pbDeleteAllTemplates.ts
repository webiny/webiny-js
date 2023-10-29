import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            // Combined method to list and delete all templates
            pbDeleteAllTemplates(): void;
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
    cy.login().then(user => {
        // First, list all page templates
        gqlClient
            .request({
                query: LIST_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(listResponse => {
                const templates = listResponse.pageBuilder.listPageTemplates.data;

                // Loop through the templates and delete each one
                templates.forEach((template: { id: any; }) => {
                    gqlClient
                        .request({
                            query: DELETE_MUTATION,
                            variables: {
                                id: template.id
                            },
                            authToken: user.idToken.jwtToken
                        })
                        .then(deleteResponse => {
                            const error = deleteResponse.pageBuilder.deletePageTemplate.error;
                            if (error) {
                                // Handle any errors that occur during deletion if needed
                                // You can use Cypress log or assertion to report the error
                                cy.log(`Error deleting template with ID: ${template.id}`);
                            }
                        });
                });
            });
    });
});
