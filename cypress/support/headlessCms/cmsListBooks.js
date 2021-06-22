import { GraphQLClient } from "graphql-request";
import { LIST_BOOKS } from "./graphql";

Cypress.Commands.add("cmsListBooks", (variables, token) => {
    const makeRequest = token => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        return client.request(LIST_BOOKS, variables).then(response => response.listBooks.data);
    };

    if (token) {
        return makeRequest(token);
    }

    cy.login().then(user => {
        return makeRequest(user.idToken.jwtToken);
    });
});
