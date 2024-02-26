import { GraphQLClient } from "graphql-request";
import { DELETE_FORM } from "./graphql";

Cypress.Commands.add("fbDeleteForm", variables => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        return client
            .request(DELETE_FORM, variables)
            .then(responce => responce.formBuilder.deleteForm.data);
    });
});
