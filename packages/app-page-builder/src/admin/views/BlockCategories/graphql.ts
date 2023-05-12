import gql from "graphql-tag";
import { PbBlockCategory, PbErrorResponse } from "~/types";

export const PAGE_BLOCK_CATEGORY_BASE_FIELDS = `
    slug
    name
    icon
    description
    createdOn
    createdBy {
        id
        displayName
    }
`;

export const LIST_BLOCK_CATEGORIES = gql`
    query ListBlockCategories {
        pageBuilder {
            listBlockCategories {
                data {
                    ${PAGE_BLOCK_CATEGORY_BASE_FIELDS}
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
 * Get Block Category Query Response
 */
export interface GetBlockCategoryQueryResponse {
    pageBuilder: {
        getBlockCategory: {
            data: PbBlockCategory | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface GetBlockCategoryQueryVariables {
    slug: string;
}
export const GET_BLOCK_CATEGORY = gql`
    query GetBlockCategory($slug: String!) {
        pageBuilder {
            getBlockCategory(slug: $slug){
                data {
                    ${PAGE_BLOCK_CATEGORY_BASE_FIELDS}
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
 * Create Block Category Mutation Response
 */
export interface CreateBlockCategoryMutationResponse {
    pageBuilder: {
        blockCategory: {
            data: PbBlockCategory | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface CreateBlockCategoryMutationVariables {
    data: {
        name: string;
        slug: string;
    };
}
export const CREATE_BLOCK_CATEGORY = gql`
    mutation CreateBlockCategory($data: PbBlockCategoryInput!){
        pageBuilder {
            blockCategory: createBlockCategory(data: $data) {
                data {
                    ${PAGE_BLOCK_CATEGORY_BASE_FIELDS}
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
 * Update Block Category Mutation Response
 */
export interface UpdateBlockCategoryMutationResponse {
    pageBuilder: {
        blockCategory: {
            data: PbBlockCategory | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface UpdateBlockCategoryMutationVariables {
    slug: string;
    data: {
        name: string;
        slug: string;
    };
}
export const UPDATE_BLOCK_CATEGORY = gql`
    mutation UpdateBlockCategory($slug: String!, $data: PbBlockCategoryInput!){
        pageBuilder {
            blockCategory: updateBlockCategory(slug: $slug, data: $data) {
                data {
                    ${PAGE_BLOCK_CATEGORY_BASE_FIELDS}
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

export const DELETE_BLOCK_CATEGORY = gql`
    mutation DeleteBlockCategory($slug: String!) {
        pageBuilder {
            deleteBlockCategory(slug: $slug) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
