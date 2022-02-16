import gql from "graphql-tag";
import { PbCategory, PbErrorResponse } from "~/types";

const BASE_FIELDS = `
    slug
    name
    layout
    url
    createdOn
    createdBy {
        id
        displayName
    }
`;

export const LIST_CATEGORIES = gql`
    query ListCategories {
        pageBuilder {
            listCategories {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    data
                    code
                    message
                }
            }
        }
    }
`;
/**
 * ###########################
 * Get Category Query Response
 */
export interface GetCategoryQueryResponse {
    pageBuilder: {
        getCategory: {
            data: PbCategory | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface GetCategoryQueryVariables {
    slug: string;
}
export const GET_CATEGORY = gql`
    query GetCategory($slug: String!) {
        pageBuilder {
            getCategory(slug: $slug){
                data {
                    ${BASE_FIELDS}
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
/**
 * ###########################
 * Create Category Mutation Response
 */
export interface CreateCategoryMutationResponse {
    pageBuilder: {
        category: {
            data: PbCategory | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface CreateCategoryMutationVariables {
    data: {
        name: string;
        slug: string;
        url: string;
        layout: string;
    };
}
export const CREATE_CATEGORY = gql`
    mutation CreateCategory($data: PbCategoryInput!){
        pageBuilder {
            category: createCategory(data: $data) {
                data {
                    ${BASE_FIELDS}
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

/**
 * ###########################
 * Update Category Mutation Response
 */
export interface UpdateCategoryMutationResponse {
    pageBuilder: {
        category: {
            data: PbCategory | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface UpdateCategoryMutationVariables {
    slug: string;
    data: {
        name: string;
        slug: string;
        url: string;
        layout: string;
    };
}
export const UPDATE_CATEGORY = gql`
    mutation UpdateCategory($slug: String!, $data: PbCategoryInput!){
        pageBuilder {
            category: updateCategory(slug: $slug, data: $data) {
                data {
                    ${BASE_FIELDS}
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

export const DELETE_CATEGORY = gql`
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
