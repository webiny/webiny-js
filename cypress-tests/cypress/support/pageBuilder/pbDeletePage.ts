import { gqlClient } from "../utils";
import { login, User } from "../login";

const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                error {
                    message
                    data
                    code
                }
            }
        }
    }
`;

interface PbDeletePageParams {
    user: User;
    variables: { id: string };
}

export const pbDeletePage = ({ user, variables }: PbDeletePageParams) => {
    return gqlClient.request({
        query: DELETE_PAGE,
        variables,
        authToken: user.idToken.jwtToken
    });
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeletePage(
                variables: PbDeletePageParams["variables"]
            ): ReturnType<typeof pbDeletePage>;
        }
    }
}

Cypress.Commands.add("pbDeletePage", variables => {
    return login().then(user => {
        return pbDeletePage({ user, variables });
    });
});
