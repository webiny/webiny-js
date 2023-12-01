import gql from "graphql-tag";

import { PbPageBlock, PbErrorResponse } from "~/types";

import { PAGE_BLOCK_CATEGORY_BASE_FIELDS } from "~/admin/views/BlockCategories/graphql";
export { LIST_BLOCK_CATEGORIES } from "~/admin/views/BlockCategories/graphql";

const PAGE_BLOCK_BASE_FIELDS = `
    id
    blockCategory
    name
    content
    createdOn
    createdBy {
        id
        displayName
        type
    }
`;

export const LIST_PAGE_CATEGORIES = gql`
    query ListBlockCategories {
        pageBuilder {
            listBlockCategories {
                data {
                    ${PAGE_BLOCK_CATEGORY_BASE_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;
/**
 * ##############################
 * Get Page Block Query
 */
export interface GetPageBlockQueryResponse {
    pageBuilder: {
        getPageBlock: {
            data: PbPageBlock | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface GetPageBlockQueryVariables {
    id: string;
}
export const GET_PAGE_BLOCK = gql`
    query GetPageBlocks($id: ID!) {
        pageBuilder {
            getPageBlock(id: $id) {
                data {
                    ${PAGE_BLOCK_BASE_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;
/**
 * ##############################
 * List Page Blocks Query
 */
export interface ListPageBlocksQueryResponse {
    pageBuilder: {
        listPageBlocks: {
            data: PbPageBlock[] | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface ListPageBlocksQueryVariables {
    blockCategory?: string;
    limit?: number;
}
export const LIST_PAGE_BLOCKS = gql`
    query ListPageBlocks($blockCategory: String) {
        pageBuilder {
            listPageBlocks(where: {blockCategory:$blockCategory}) {
                data {
                    ${PAGE_BLOCK_BASE_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;
/**
 * ###########################
 * Create Page Block Mutation Response
 */
export interface CreatePageBlockMutationResponse {
    pageBuilder: {
        pageBlock: {
            data: PbPageBlock | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface CreatePageBlockMutationVariables {
    data: {
        name: string;
        content: any;
        blockCategory: string;
    };
}
export const CREATE_PAGE_BLOCK = gql`
    mutation CreatePageBlock($data: PbCreatePageBlockInput!){
        pageBuilder {
            pageBlock: createPageBlock(data: $data) {
                data {
                    ${PAGE_BLOCK_BASE_FIELDS}
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
 * Update Page Block Mutation Response
 */
export interface UpdatePageBlockMutationResponse {
    pageBuilder: {
        pageBlock: {
            data: PbPageBlock | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface UpdatePageBlockMutationVariables {
    id: string;
    data: {
        name: string;
        blockCategory: string;
        content: any;
    };
}
export const UPDATE_PAGE_BLOCK = gql`
    mutation UpdatePageBlock($id: ID!, $data: PbUpdatePageBlockInput!){
        pageBuilder {
            pageBlock: updatePageBlock(id: $id, data: $data) {
                data {
                    ${PAGE_BLOCK_BASE_FIELDS}
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

export interface DeletePageBlockMutationResponse {
    pageBuilder: {
        deletePageBlock: {
            data: boolean | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface DeletePageBlockMutationVariables {
    id: string;
}

export const DELETE_PAGE_BLOCK = gql`
    mutation DeletePageBlock($id: ID!) {
        pageBuilder {
            deletePageBlock(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
