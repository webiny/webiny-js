import { GraphQLClient } from "graphql-request";

declare global {
    namespace Cypress {
        interface Chainable {
            createCategory(data: {
                name: string;
                slug: string;
                layout: string;
                url: string;
                // Add other fields as needed
            }): void;
        }
    }
}

const MUTATION = /* GraphQL */ `
    mutation CreateCategory($data: PbCategoryInput!) {
        pageBuilder {
            category: createCategory(data: $data) {
                data {
                    slug
                    name
                    layout
                    url
                    createdOn
                    createdBy {
                        id
                        displayName
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

Cypress.Commands.add("createCategory", data => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        // Step 1: Create the category
        client.request(MUTATION, { data: data }).then(response => {
            // Step 2: Handle the response as needed (e.g., log or perform assertions)
            if (response.pageBuilder.category.error) {
                // Handle any errors that occurred during category creation
                // You can log the error or perform other actions as needed
                console.error(response.pageBuilder.category.error);
            }
        });
    });
});



