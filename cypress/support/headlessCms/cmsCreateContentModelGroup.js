import { GraphQLClient } from "graphql-request";
import { CREATE_CONTENT_MODEL_GROUP } from "./graphql";

Cypress.Commands.add("cmsCreateContentModelGroup", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("CMS_MANAGE_GRAPHQL_API_URL") + "/en-US", {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(CREATE_CONTENT_MODEL_GROUP, variables)
            .then(response => response.createContentModelGroup.data);
    });
});
