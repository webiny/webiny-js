import { gqlClient } from "../utils";
import { login, User } from "../login";

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
                    pid
                    title
                    path
                    status
                }
            }
        }
    }
`;

interface PbListPagesParams {
    user: User;
    variables?: Record<string, any>;
}

export const pbListPages = ({ user, variables = {} }: PbListPagesParams) => {
    return gqlClient
        .request({
            query: LIST_PAGES,
            variables,
            authToken: user.idToken.jwtToken
        })
        .then(response => response.pageBuilder.listPages.data);
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbListPages(variables: Record<string, any>): ReturnType<typeof pbListPages>;
        }
    }
}

Cypress.Commands.add("pbListPages", (variables = {}) => {
    return login().then(user => {
        return pbListPages({ user, variables });
    });
});
