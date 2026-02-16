import type { useGraphQLHandler } from "./useGraphQLHandler";

type ManageHandler = ReturnType<typeof useGraphQLHandler>;

interface ProductValues {
    name: string;
    sku: string;
    description: string;
    price: number;
    category?: string;
}

interface ProductCategoryValues {
    name: string;
    slug: string;
    description: string;
}

/**
 * Helper to create a product entry via the manage endpoint.
 */
export const createProduct = async (handler: ManageHandler, values: ProductValues) => {
    const [response] = await handler.invoke({
        body: {
            query: `mutation CreateProduct($data: ProductInput!) {
                createProduct(data: $data) {
                    data {
                        id
                    }
                    error {
                        message
                        code
                    }
                }
            }`,
            variables: {
                data: {
                    values
                }
            }
        }
    });

    if (response.data.createProduct.error) {
        throw new Error(`Failed to create product: ${response.data.createProduct.error.message}`);
    }

    return response.data.createProduct.data.id as string;
};

/**
 * Helper to publish a product entry via the manage endpoint.
 */
export const publishProduct = async (handler: ManageHandler, revisionId: string) => {
    const [response] = await handler.invoke({
        body: {
            query: `mutation PublishProduct($revision: ID!) {
                publishProduct(revision: $revision) {
                    data {
                        id
                    }
                    error {
                        message
                        code
                    }
                }
            }`,
            variables: {
                revision: revisionId
            }
        }
    });

    if (response.data.publishProduct.error) {
        throw new Error(`Failed to publish product: ${response.data.publishProduct.error.message}`);
    }

    return response.data.publishProduct.data.id as string;
};

/**
 * Helper to create a product category entry via the manage endpoint.
 */
export const createProductCategory = async (
    handler: ManageHandler,
    values: ProductCategoryValues
) => {
    const [response] = await handler.invoke({
        body: {
            query: `mutation CreateProductCategory($data: ProductCategoryInput!) {
                createProductCategory(data: $data) {
                    data {
                        id
                    }
                    error {
                        message
                        code
                    }
                }
            }`,
            variables: {
                data: {
                    values
                }
            }
        }
    });

    if (response.data.createProductCategory.error) {
        throw new Error(
            `Failed to create product category: ${response.data.createProductCategory.error.message}`
        );
    }

    return response.data.createProductCategory.data.id as string;
};
