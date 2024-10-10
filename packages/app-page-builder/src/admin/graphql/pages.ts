import gql from "graphql-tag";
import { PbElement, PbErrorResponse, PbPageRevision } from "~/types";

const error = `
    error {
        code
        message
        data
}`;

export interface PageResponseData {
    id: string;
    pid: string;
    title: string;
    path: string;
    version: string;
    locked: boolean;
    status: string;
    revisions: PbPageRevision[];
    createdBy: {
        id: string;
        displayName: string;
    };
    savedOn: string;
    category: {
        name: string;
    };
    content: Record<string, any>;
}

export const DATA_FIELDS = `
    id
    pid
    title
    path
    version
    locked
    status
    wbyAco_location {
        folderId
    }
    revisions {
        id
        pid
        savedOn
        locked
        title
        status
        version
    }
    
`;

export const LIST_PAGES_DATA_FIELDS = `
    id
    pid
    status
    title
    version
    savedOn
    category {
        name
        slug
    }
    createdBy {
        id
        displayName
    }
`;

export const CREATE_PAGE = gql`
    mutation PbCreatePage($from: ID, $category: String, $meta: JSON) {
        pageBuilder {
            createPage(from: $from, category: $category, meta: $meta) {
                data {
                    ${LIST_PAGES_DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const CREATE_PAGE_FROM_TEMPLATE = gql`
    mutation PbCreatePageFromTemplate($templateId: ID, $meta: JSON) {
        pageBuilder {
            createPage: createPageFromTemplate(templateId: $templateId, meta: $meta) {
                data {
                    ${LIST_PAGES_DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const DUPLICATE_PAGE = gql`
    mutation PbDuplicatePage($id: ID!, $meta: JSON) {
        pageBuilder {
            duplicatePage(id: $id, meta: $meta) {
                data {
                    ${LIST_PAGES_DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const UPDATE_PAGE = gql`
    mutation PbUpdatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data {
                    ${LIST_PAGES_DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const LIST_PAGES = gql`
    query PbListPages(
        $where: PbListPagesWhereInput
        $sort: [PbListPagesSort!]
        $search: PbListPagesSearchInput
        $limit: Int
        $after: String
    ) {
        pageBuilder {
            listPages(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data {
                    ${LIST_PAGES_DATA_FIELDS}
                }
                meta {
                    totalCount
                    hasMoreItems
                    cursor
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
 * ##############################
 * Get Page Query Response
 */
export interface GetPageQueryResponse<T extends PageResponseData = PageResponseData> {
    pageBuilder: {
        getPage:
            | {
                  data: T;
                  error: null;
              }
            | {
                  data: null;
                  error: PbErrorResponse;
              };
    };
}

export interface GetPageQueryVariables {
    id: string;
}

export const GET_PAGE = gql`
    query PbGetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data {
                    ${DATA_FIELDS}
                    createdBy {
                        id
                        displayName
                    }
                    savedOn
                    category {
                        name
                    }
                    content

                }
                ${error}
            }
        }
    }
`;
export const PUBLISH_PAGE = gql`
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    ${DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = gql`
    mutation PbUnpublishPage($id: ID!) {
        pageBuilder {
            unpublishPage(id: $id) {
                data {
                    ${DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

/**
 * ##########################
 * Delete Page Mutation
 */
interface DeletePageMutationResponseData {
    latestPage: {
        id: string;
        status: string;
        version: number;
    };
}

export interface DeletePageMutationResponse {
    pageBuilder: {
        deletePage: {
            data: DeletePageMutationResponseData | null;
            error: PbErrorResponse | null;
        };
    };
}

export interface DeletePageMutationVariables {
    id: string;
}

export const DELETE_PAGE = gql`
    mutation PbDeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data {
                    latestPage {
                        id
                        status
                        version
                    }
                }
                ${error}
            }
        }
    }
`;

const PAGE_ELEMENT_FIELDS = /*GraphQL*/ `
    {
        id
        name
        type
        content
    }
`;

/**
 * ##############################
 * List Page Elements Query
 */
export interface ListPageElementsQueryResponseDataPreview {
    src: string;
    meta: {
        width: number;
        height: number;
        aspectRatio: number;
    };
}

export interface ListPageElementsQueryResponseData {
    id: string;
    name: string;
    type: string;
    content: PbElement;
}

export interface ListPageElementsQueryResponse {
    pageBuilder: {
        data?: ListPageElementsQueryResponseData[];
        error?: PbErrorResponse;
    };
}

export const LIST_PAGE_ELEMENTS = gql`
    query PbListPageElements {
        pageBuilder {
            listPageElements {
                data ${PAGE_ELEMENT_FIELDS}
            }
        }
    }
`;

export const CREATE_PAGE_ELEMENT = gql`
    mutation PbCreatePageElement($data: PbCreatePageElementInput!) {
        pageBuilder {
            createPageElement(data: $data) {
                data ${PAGE_ELEMENT_FIELDS}
                ${error}
            }
        }
    }
`;
