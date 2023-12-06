import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbPublishPage(id: string): Promise<{ id: string }>;
        }
    }
}

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                }
            }
        }
    }
`;

Cypress.Commands.add("pbPublishPage", id => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: PUBLISH_PAGE,
                variables: { id },
                authToken: user.idToken.jwtToken
            })
            .then(response => {
                // Check for any error in the response
                const { error, data } = response.pageBuilder.publishPage;
                if (error) {
                    // Handle the error as needed
                    throw new Error(`Failed to publish page: ${error.message}`);
                }

                return data;
            });
    });
});
