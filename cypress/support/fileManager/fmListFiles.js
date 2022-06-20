import { GraphQLClient } from "graphql-request";
import { LIST_FILES } from "./graphql";

export const fmListFiles = ({ user, variables = {} }) => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
        headers: {
            authorization: `Bearer ${user.idToken.jwtToken}`
        }
    });

    return client.request(LIST_FILES, variables).then(response => response.fileManager.files.data);
};

Cypress.Commands.add("fmListFiles", (variables = {}) => {
    cy.login().then(user => fmListFiles({ user, variables }));
});
