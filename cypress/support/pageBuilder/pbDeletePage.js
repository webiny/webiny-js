import { GraphQLClient } from "graphql-request";
import { DELETE_PAGE } from "./graphql";
import { login } from "../login";

export const pbDeletePage = ({ user, variables = {} }) => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
        headers: {
            authorization: `Bearer ${user.idToken.jwtToken}`
        }
    });

    return client
        .request(DELETE_PAGE, variables)
        .then(response => response.pageBuilder.deletePage.data);
};

Cypress.Commands.add("pbDeletePage", (variables = {}) => {
    return login().then(user => {
        return pbDeletePage({ user, variables });
    });
});
