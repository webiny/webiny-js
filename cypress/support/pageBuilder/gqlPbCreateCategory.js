import get from "lodash.get";

const CREATE_CATEGORY = /* GraphQL */ `
    mutation createCategory($data: PbCategoryInput!) {
        pageBuilder {
            createCategory(data: $data) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

Cypress.Commands.add("gqlPbCreateCategory", () => {
    return cy.log(`Creating a new Page Builder category...`).then(async () => {
        return cy
            .gql(CREATE_CATEGORY, {
                data: { name: "das", slug: "das", layout: "static", url: "/asd" }
            })
            .then(response => {
                return get(response, "pageBuilder.createCategory.data");
            });
    });
});
