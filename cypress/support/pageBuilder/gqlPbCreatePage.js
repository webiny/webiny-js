import get from "lodash.get";

const CREATE_PAGE = /* GraphQL */ `
    mutation createPage($data: PbCreatePageInput!) {
        pageBuilder {
            createPage(data: $data) {
                data {
                    id
                    title
                }
            }
        }
    }
`;

Cypress.Commands.add("gqlPbCreatePage", data => {
    return cy.log(`Creating a new Page Builder page...`).then(async () => {
        return cy
            .gql(CREATE_PAGE, {
                data
            })
            .then(response => {
                console.log('rezaa', response)
                return get(response, "pageBuilder.createPage.data");
            });
    });
});
