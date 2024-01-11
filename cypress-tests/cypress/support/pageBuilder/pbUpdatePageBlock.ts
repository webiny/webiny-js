import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbUpdatePageBlock(id: string, data: any): Promise<any>;
        }
    }
}
const UPDATE_PAGE_BLOCK = /* GraphQL */ `
    mutation UpdatePageBlock($id: ID!, $data: PbUpdatePageBlockInput!) {
        pageBuilder {
            pageBlock: updatePageBlock(id: $id, data: $data) {
                data {
                    id
                    blockCategory
                    name
                    content
                    createdOn
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

Cypress.Commands.add("pbUpdatePageBlock", (id, data) => {
    return cy.login().then(user => {
        return gqlClient
            .request({
                query: UPDATE_PAGE_BLOCK,
                variables: {
                    id,
                    data: {
                        blockCategory: data.slug,
                        name: data.name,
                        content: {
                            id: "xyz",
                            type: "block",
                            data: {},
                            elements: [data.content.elements]
                        }
                    }
                },
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.pageTemplate);
    });
});
