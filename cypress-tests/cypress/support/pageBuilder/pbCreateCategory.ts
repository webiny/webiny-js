import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbCreateCategory(data: {
                name: string;
                slug: string;
                layout: string;
                url: string;
                // Add other fields as needed
            }): void;
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation pbCreateCategory($data: PbCategoryInput!) {
        pageBuilder {
            category: createCategory(data: $data) {
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
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

Cypress.Commands.add("pbCreateCategory", data => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: MUTATION,
                variables: { data },
                authToken: user.idToken.jwtToken
            })
            .then(response => {
                if (response.pageBuilder.category.error) {
                    console.error(response.pageBuilder.category.error);
                }
            });
    });
});
