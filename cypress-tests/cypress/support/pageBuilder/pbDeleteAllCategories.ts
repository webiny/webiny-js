import { GraphQLClient } from "graphql-request";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeleteAllCategories(): void;
        }
    }
}

const LIST_CATEGORIES_QUERY = /* GraphQL */ `
    query ListCategories {
        pageBuilder {
            listCategories {
                data {
                    slug
                }
            }
        }
    }
`;

const DELETE_CATEGORY_MUTATION = /* GraphQL */ `
    mutation DeleteCategory($slug: String!) {
        pageBuilder {
            deleteCategory(slug: $slug) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

Cypress.Commands.add("pbDeleteAllCategories", () => {
    cy.login().then(user => {
        const client = new GraphQLClient(Cypress.env("GRAPHQL_API_URL"), {
            headers: {
                authorization: `Bearer ${user.idToken.jwtToken}`
            }
        });

        // Step 1: Fetch categories
        client.request(LIST_CATEGORIES_QUERY).then(response => {
            const categories = response.pageBuilder.listCategories.data;

            // Step 2: Filter and delete categories
            categories.forEach(category => {
                // Check criteria for deletion (exclude categories with "Static" in name or "/static/" in URL)
                if (
                    category.slug === "static"
                ) {
                    // Skip this category
                    return;
                }

                // Delete the category that doesn't meet the criteria
                client
                    .request(DELETE_CATEGORY_MUTATION, { slug: category.slug })
                    .then(deletionResponse => {
                        if (deletionResponse.pageBuilder.deleteCategory.error) {
                            // Handle any errors that occurred during deletion
                            // You can log the error or perform other actions as needed
                            console.error(deletionResponse.pageBuilder.deleteCategory.error);
                        }
                    });
            });
        });
    });
});
