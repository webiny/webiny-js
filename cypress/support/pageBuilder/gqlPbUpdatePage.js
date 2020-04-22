import get from "lodash.get";

const UPDATE_PAGE = /* GraphQL */ `
    mutation updatePage($data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(data: $data) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

Cypress.Commands.add("gqlPbUpdatePage", data => {
    return cy.log(`Creating a new Page Builder page...`).then(async () => {
        return cy
            .gql(UPDATE_PAGE, {
                data
            })
            .then(response => {
                return get(response, "pageBuilder.updatePage.data");
            });
    });
});
