import { gqlClient } from "../utils"; // Replace with your actual gqlClient library

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
    return cy.login().then(user => {
        // Step 1: Fetch categories
        return gqlClient
            .request({
                query: LIST_CATEGORIES_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(async listResponse => {
                const categories = listResponse.pageBuilder.listCategories.data;

                return Promise.all(
                    categories.map(category => {
                        // Check criteria for deletion (exclude categories with "Static" in name or "/static/" in URL)
                        if (category.slug === "static") {
                            // Skip this category
                            return null;
                        }

                        // Delete the category that doesn't meet the criteria
                        return gqlClient
                            .request({
                                query: DELETE_CATEGORY_MUTATION,
                                variables: { slug: category.slug },
                                authToken: user.idToken.jwtToken
                            })
                            .then(deletionResponse => {
                                if (deletionResponse.pageBuilder.deleteCategory.error) {
                                    console.error(
                                        deletionResponse.pageBuilder.deleteCategory.error
                                    );
                                }
                            });
                    })
                );
            });
    });
});
