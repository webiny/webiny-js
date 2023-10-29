import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreatePageTemplate(data: any): Promise<any>; // Update the data type as needed
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation CreatePageTemplate($data: PbCreatePageTemplateInput!) {
        pageBuilder {
            pageTemplate: createPageTemplate(data: $data) {
                data {
                    id
                    title
                    slug
                    tags
                    description
                    layout
                    content
                    pageCategory
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

Cypress.Commands.add("pbCreatePageTemplate", data => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: MUTATION,
                variables: {
                    data
                },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.pageTemplate);
    });
});
