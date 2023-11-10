import { gqlClient } from "../utils";

interface PbUpdatePageInput {
    id: string;
    data: {
        category?: string;
        path?: string;
        title?: string;
        settings?: {
            general?: {
                layout?: string;
                tags?: string[];
            };
        };
    };
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbUpdatePage(data: PbUpdatePageInput): Chainable<Promise<string>>;
        }
    }
}

const UPDATE_PAGE = /* GraphQL */ `
    mutation updatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data {
                    id
                    content
                    title
                    path
                    status
                    savedOn
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

Cypress.Commands.add("pbUpdatePage", data => {
    cy.login().then(user => {
        return gqlClient
            .request({
                query: UPDATE_PAGE,
                variables: data,
                authToken: user.idToken.jwtToken
            })
            .then(response => {
                const { error, data } = response.pageBuilder.updatePage;
                if (error) {
                    throw new Error(`Failed to update page: ${error.message}`);
                }

                return cy.wrap(data); // Wrap the data in a Chainable
            });
    });
});
