import { GraphQLClient } from "graphql-request";
import { DELETE_CATEGORY } from "./graphql";
import { login } from "../login";

export const pbDeleteCategory = ({ user, variables = {} }) => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
        headers: {
            authorization: `Bearer ${user.idToken.jwtToken}`
        }
    });

    return client
        .request(DELETE_CATEGORY, variables)
        .then(response => response.pageBuilder.category.data);
};

Cypress.Commands.add("pbDeleteCategory", (variables = {}) => {
    return login().then(user => {
        return pbDeleteCategory({ user, variables });
    });
});
