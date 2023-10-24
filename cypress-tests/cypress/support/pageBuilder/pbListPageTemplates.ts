import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListPageTemplates(): Promise<any[]>; // Update the return type as needed
        }
    }
}

const QUERY = /* GraphQL */ `
    query ListPageTemplates {
        pageBuilder {
            listPageTemplates {
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
                    __typename
                }
            }
        }
    }
`;

Cypress.Commands.add("pbListPageTemplates", () => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.listPageTemplates.data);
    });
});
