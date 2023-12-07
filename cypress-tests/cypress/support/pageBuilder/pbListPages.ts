import { gqlClient } from "../utils";
import { login } from "../login";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListPages(
                data: any
            ): Promise<[{ id: string; title: string; path: string; status: string }]>;
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
            }
        }
    }
`;

export const pbListPages = ({ user, variables = {} }) => {
    return gqlClient
        .request({
            query: LIST_PAGES,
            variables,
            authToken: user.idToken.jwtToken
        })
        .then(response => response.pageBuilder.listPages.data);
};

Cypress.Commands.add("pbListPages", (variables = {}) => {
    return login().then(user => {
        return pbListPages({ user, variables });
    });
});
