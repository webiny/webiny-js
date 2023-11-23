import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListPages(data: any): Chainable<Promise<any[]>>;
        }
    }
}

const LIST_PAGES = /* GraphQL */ `
    query PbListPages(
        $where: PbListPagesWhereInput
        $sort: [PbListPagesSort!]
        $search: PbListPagesSearchInput
        $limit: Int
        $after: String
    ) {
        pageBuilder {
            listPages(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data {
                    id
                    title
                    path
                    status
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

Cypress.Commands.add("pbListPages", data => {
    cy.login().then(user => {
        return gqlClient
            .request<any>({
                query: LIST_PAGES,
                variables: data,
                authToken: user.idToken.jwtToken
            })
            .then(response => response.pageBuilder.listPages.data);
    });
});
