import { gqlClient } from "../utils";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            pbDeleteAllCategories(): Promise<Array<void | { code: string; message: string }>>;
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
        return gqlClient
            .request({
                query: LIST_CATEGORIES_QUERY,
                authToken: user.idToken.jwtToken
            })
            .then(async listResponse => {
                const categories = listResponse.pageBuilder.listCategories.data;

                return Promise.all(
                    categories.map((category: { slug: string }) => {
                        // Exclude the default Static category.
                        if (category.slug === "static") {
                            return null;
                        }
                        return gqlClient
                            .request({
                                query: DELETE_CATEGORY_MUTATION,
                                variables: { slug: category.slug },
                                authToken: user.idToken.jwtToken
                            })
                            .then(deletionResponse => {
                                if (deletionResponse.pageBuilder.deleteCategory.error) {
                                    return deletionResponse.pageBuilder.deleteCategory.error;
                                }
                            });
                    })
                );
            });
    });
});
