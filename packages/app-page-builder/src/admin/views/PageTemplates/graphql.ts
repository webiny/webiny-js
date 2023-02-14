import gql from "graphql-tag";
import { PbPageTemplate, PbErrorResponse } from "~/types";

const PAGE_TEMPLATE_BASE_FIELDS = `
    id
    title
    description
    layout
    content
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
`;

/**
 * ##############################
 * Get Page Template Query
 */
export interface GetPageTemplateQueryResponse {
    pageBuilder: {
        data?: PbPageTemplate;
        error?: PbErrorResponse;
    };
}
export interface GetPageTemplateQueryVariables {
    id: string;
}
export const GET_PAGE_TEMPLATE = gql`
    query GetPageTemplates($id: ID!) {
        pageBuilder {
            getPageTemplate(id: $id) {
                data {
                    ${PAGE_TEMPLATE_BASE_FIELDS}
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
 * List Page Templates Query
 */
export interface ListPageTemplatesQueryResponse {
    pageBuilder: {
        data?: PbPageTemplate[];
        error?: PbErrorResponse;
    };
}
export interface ListPageTemplatesQueryVariables {
    templateCategory: string;
}
export const LIST_PAGE_TEMPLATES = gql`
    query ListPageTemplates {
        pageBuilder {
            listPageTemplates {
                data {
                    ${PAGE_TEMPLATE_BASE_FIELDS}
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
 * Create Page Template Mutation Response
 */
export interface CreatePageTemplateMutationResponse {
    pageBuilder: {
        pageTemplate: {
            data: PbPageTemplate | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface CreatePageTemplateMutationVariables {
    data: PbPageTemplate;
}
export const CREATE_PAGE_TEMPLATE = gql`
    mutation CreatePageTemplate($data: PbCreatePageTemplateInput!){
        pageBuilder {
            pageTemplate: createPageTemplate(data: $data) {
                data {
                    ${PAGE_TEMPLATE_BASE_FIELDS}
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
 * Update Page Template Mutation Response
 */
export interface UpdatePageTemplateMutationResponse {
    pageBuilder: {
        pageTemplate: {
            data: PbPageTemplate | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface UpdatePageTemplateMutationVariables {
    id: string;
    data: {
        title?: string;
        description?: string;
        layout?: string;
        content?: string;
    };
}
export const UPDATE_PAGE_TEMPLATE = gql`
    mutation UpdatePageTemplate($id: ID!, $data: PbUpdatePageTemplateInput!){
        pageBuilder {
            pageTemplate: updatePageTemplate(id: $id, data: $data) {
                data {
                    ${PAGE_TEMPLATE_BASE_FIELDS}
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

export const DELETE_PAGE_TEMPLATE = gql`
    mutation DeletePageTemplate($id: ID!) {
        pageBuilder {
            deletePageTemplate(id: $id) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
