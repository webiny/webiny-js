import get from "lodash.get";

const GQL = /* GraphQL */ `
    query getCategory($where: JSON) {
        pageBuilder {
            getCategory(where: $where) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

Cypress.Commands.add("gqlPbGetCategory", where => {
    return cy.log(`Creating a new Page Builder category...`).then(async () => {
        return cy
            .gql(GQL, {
                where
            })
            .then(response => {
                return get(response, "pageBuilder.getCategory.data");
            });
    });
});
