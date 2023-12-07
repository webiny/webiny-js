import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            createPageTemplate(data: {
                title: string;
                slug: string;
                tags: string[];
                description: string;
                layout: string;
                pageCategory: string;
            }): Promise<{
                title: string;
                slug: string;
                tags: string[];
                description: string;
                layout: string;
                pageCategory: string;
            }>;
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation createPageTemplate($data: PbCreatePageTemplateInput!) {
        pageBuilder {
            pageTemplate: createPageTemplate(data: $data) {
                data {
                    title
                    slug
                    tags
                    description
                    layout
                    pageCategory
                }
            }
        }
    }
`;

Cypress.Commands.add("createPageTemplate", data => {
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
