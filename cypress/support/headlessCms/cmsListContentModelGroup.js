import { GraphQLClient } from "graphql-request";
import { LIST_CONTENT_MODEL_GROUPS } from "./graphql";

Cypress.Commands.add("cmsListContentModelGroup", (variables, token) => {
    const makeRequest = token => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        return client
            .request(LIST_CONTENT_MODEL_GROUPS, variables)
            .then(response => response.listContentModelGroups.data);
    };

    if (token) {
        return makeRequest(token);
    }

    cy.login().then(user => {
        return makeRequest(user.idToken.jwtToken);
    });
});
