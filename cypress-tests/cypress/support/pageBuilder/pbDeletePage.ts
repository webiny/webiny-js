import { gqlClient } from "../utils";
import { login } from "../login";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeletePage(params: { id: string }): Promise<any>;
        }
    }
}

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

export const pbDeletePage = ({ user, variables = {} }) => {
    return gqlClient
        .request({
            query: DELETE_PAGE,
            variables,
            authToken: user.idToken.jwtToken
        })
        .then(response => response.pageBuilder.deletePage.data);
};

Cypress.Commands.add("pbDeletePage", (variables = {}) => {
    return login().then(user => {
        return pbDeletePage({ user, variables });
    });
});