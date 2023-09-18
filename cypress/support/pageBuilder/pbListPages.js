import { LIST_PAGES } from "./graphql";
import { login } from "../login";
import { gqlClient } from "../utils";

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
