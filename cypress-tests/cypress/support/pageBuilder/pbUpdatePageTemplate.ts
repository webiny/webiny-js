import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbUpdatePageTemplate(id: string, data: any): Promise<any>;
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation UpdatePageTemplate($id: ID!, $data: PbUpdatePageTemplateInput!) {
        pageBuilder {
            pageTemplate: updatePageTemplate(id: $id, data: $data) {
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

Cypress.Commands.add("pbUpdatePageTemplate", (id, data) => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: MUTATION,
                variables: {
                    id,
                    data
                },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.pageTemplate);
    });
});
