import { gqlClient } from "../utils";

declare global {
        // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbPublishPage(id: string): Chainable<Promise<any[]>>;
        }
    }
}

const PUBLISH_PAGE = /* GraphQL */ `
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                    pid
                    title
                    path
                    version
                    locked
                    status
                    revisions {
                        id
                        savedOn
                        locked
                        title
                        status
                        version
                        __typename
                    }
                    __typename
                }
                error {
                    code
                    message
                    data
                    __typename
                }
                __typename
            }
            __typename
        }
    }
`;

// Update the pbPublishPage method
Cypress.Commands.add("pbPublishPage", id => {
    cy.login().then(user => {
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

                // Return the published page data wrapped in Chainable
                return cy.wrap(data);
            });
    });
});
