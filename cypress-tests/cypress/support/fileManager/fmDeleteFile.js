import { GraphQLClient } from "graphql-request";
import { DELETE_FILE } from "./graphql";
import { login } from "../login";

export const fmDeleteFile = ({ user, variables = {} }) => {
    const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
        headers: {
            authorization: `Bearer ${user.idToken.jwtToken}`
        }
    });

    return client
        .request(DELETE_FILE, variables)
        .then(response => response.fileManager.deleteFile.data);
};

Cypress.Commands.add("fmDeleteFile", (variables = {}) => {
    return login().then(user => {
        return fmDeleteFile({ user, variables });
    });
});
