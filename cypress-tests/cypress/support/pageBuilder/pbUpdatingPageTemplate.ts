import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbUpdatingPageTemplate(id: string, data: any): Promise<any>;
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

Cypress.Commands.add("pbUpdatingPageTemplate", (id, data) => {
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


//Example of usage
// Suppose you have a page template ID and updated data
//const pageTemplateId = "your-page-template-id";
//const updatedData = {
//    title: "Updated Page Title",
//    description: "Updated Page Description",
//    tags: ["tag1", "tag2"],
//    layout: "updated-layout",
//};
//
//cy.pbUpdatePageTemplate(pageTemplateId, updatedData).then(updatedPageTemplate => {
//    cy.log("Updated Page Template:", updatedPageTemplate);
//});