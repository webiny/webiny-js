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
            }): Promise<{ slug: string; name: string; layout: string; url: string }>;
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
                return response.pageBuilder.category.data;
            });
    });
});
