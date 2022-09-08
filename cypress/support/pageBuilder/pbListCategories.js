import { GraphQLClient } from "graphql-request";
import { LIST_CATEGORIES } from "./graphql";
import { login } from "../login";

export const pbListCategories = ({ user, variables = {} }) => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
        headers: {
            authorization: `Bearer ${user.idToken.jwtToken}`
        }
    });

    return client
        .request(LIST_CATEGORIES, variables)
        .then(response => response.pageBuilder.listCategories.data);
};

Cypress.Commands.add("pbListCategories", (variables = {}) => {
    return login().then(user => {
        return pbListCategories({ user, variables });
    });
});
