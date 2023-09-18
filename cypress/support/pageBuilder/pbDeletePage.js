import { DELETE_PAGE } from "./graphql";
import { login } from "../login";
import { gqlClient } from "../utils";

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
