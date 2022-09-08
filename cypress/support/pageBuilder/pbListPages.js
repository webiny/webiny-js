import { GraphQLClient } from "graphql-request";
import { LIST_PAGES } from "./graphql";
import { login } from "../login";

export const pbListPages = ({ user, variables = {} }) => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
        headers: {
            authorization: `Bearer ${user.idToken.jwtToken}`
        }
    });

    return client
        .request(LIST_PAGES, variables)
        .then(response => response.pageBuilder.listPages.data);
};

Cypress.Commands.add("pbListPages", (variables = {}) => {
    return login().then(user => {
        return pbListPages({ user, variables });
    });
});
