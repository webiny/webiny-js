export interface PageData {
    id: string;
    pid: string;
    editor: string;
    category: {
        slug: string;
    };
    version: number;
    title: string;
    path: string;
    url: string;
    content: Record<string, any>;
    savedOn: string;
    status: string;
    locked: boolean;
    publishedOn: string;
    revisions: {
        id: string;
        status: string;
        locked: boolean;
        version: number;
    }[];
    settings: {
        general: {
            snippet: string;
            tags: string[];
            layout: string;
            image: {
                id: string;
                src: string;
            };
        };
        social: {
            meta: {
                property: string;
                content: string;
            };
            title: string;
            description: string;
            image: {
                id: string;
                src: string;
            };
        };
        seo: {
            title: string;
            description: string;
            meta: {
                name: string;
                content: string;
            };
        };
    };
    createdFrom: string;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
}

interface CreateDataFieldsParams {
    fields?: string[];
}

export const createDataFields = (params: CreateDataFieldsParams = {}) => {
    const { fields = [] } = params;
    return /* GraphQL */ `
        {
            id
            pid
            editor
            category {
                slug
            }
            version
            title
            path
            url
            content
            savedOn
            status
            locked
            publishedOn
            revisions {
                id
                status
                locked
                version
            }
            settings {
                general {
                    snippet
                    tags
                    layout
                    image {
                        id
                        src
                    }
                }
                social {
                    meta {
                        property
                        content
                    }
                    title
                    description
                    image {
                        id
                        src
                    }
                }
                seo {
                    title
                    description
                    meta {
                        name
                        content
                    }
                }
            }
            createdFrom
            createdOn
            createdBy {
                id
                displayName
                type
            }
            ${fields.join("\n")}
        }
    `;
};

export const DATA_FIELD = createDataFields();

interface CreateListDataFieldsParams {
    fields?: string[];
}

export const createListDataFields = (params: CreateListDataFieldsParams = {}) => {
    const { fields = [] } = params;
    return /* GraphQL */ `
        {
            id
            pid
            editor
            category {
                slug
            }
            status
            title
            snippet
            tags
            images {
                general {
                    id
                    src
                }
            }
            path
            url
            status
            locked
            publishedOn
            savedOn
            createdFrom
            createdOn
            createdBy {
                id
                displayName
                type
            }
            settings
            ${fields.join("\n")}
        }
    `;
};

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const createPageCreateGraphQl = (params: CreateDataFieldsParams = {}) => {
    return /* GraphQL */ `
        mutation CreatePage($from: ID, $category: String) {
            pageBuilder {
                createPage(from: $from, category: $category) {
                    data ${createDataFields(params)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const CREATE_PAGE = createPageCreateGraphQl();

export const createPageUpdateGraphQl = (params: CreateDataFieldsParams = {}) => {
    return /* GraphQL */ `
        mutation UpdatePage($id: ID!, $data: PbUpdatePageInput!) {
            pageBuilder {
                updatePage(id: $id, data: $data) {
                    data ${createDataFields(params)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const UPDATE_PAGE = createPageUpdateGraphQl();

export const createPageDuplicateGraphQl = (params: CreateDataFieldsParams = {}) => {
    return /* GraphQL */ `
        mutation DuplicatePage($id: ID!, $meta: JSON) {
            pageBuilder {
                duplicatePage(id: $id, meta: $meta) {
                    data ${createDataFields(params)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const DUPLICATE_PAGE = createPageDuplicateGraphQl();

export const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        pageBuilder {
            unpublishPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const UNLINK_PAGE_FROM_TEMPLATE = /* GraphQL */ `
    mutation UnlinkPageFromTemplate($id: ID!) {
        pageBuilder {
            unlinkPageFromTemplate(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const OEMBED_DATA = /* GraphQL */ `
    query GetOEmbedData($url: String!, $width: String, $height: String) {
        pageBuilder {
            oembedData(url: $url, width: $width, height: $height) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const createPageListGraphQl = (params: CreateListDataFieldsParams = {}) => {
    return /* GraphQL */ `
        query ListPages($where: PbListPagesWhereInput, $limit: Int, $after: String, $sort: [PbListPagesSort!], $search: PbListPagesSearchInput) {
            pageBuilder {
                listPages(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                    data ${createListDataFields(params)}
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const LIST_PAGES = createPageListGraphQl();

export const createPageListPublishedGraphQl = (params: CreateListDataFieldsParams = {}) => {
    return /* GraphQL */ `
        query ListPublishedPages($where: PbListPublishedPagesWhereInput, $limit: Int, $after: String, $sort: [PbListPagesSort!], $exclude: [String]) {
            pageBuilder {
                listPublishedPages(where: $where, limit: $limit, after: $after, sort: $sort, exclude: $exclude) {
                    data ${createListDataFields(params)}
                    error ${ERROR_FIELD}
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                }
            }
        }
    `;
};

export const LIST_PUBLISHED_PAGES = createPageListPublishedGraphQl();

export const LIST_PAGE_TAGS = /* GraphQL */ `
    query ListPageTags($search: PbListPageTagsSearchInput!) {
        pageBuilder {
            listPageTags(search: $search) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const createPageGetGraphQl = (params: CreateDataFieldsParams = {}) => {
    return /* GraphQL */ `
        query GetPage($id: ID!) {
            pageBuilder {
                getPage(id: $id) {
                    data ${createDataFields(params)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const GET_PAGE = createPageGetGraphQl();

export const createPageGetPublishedGraphQl = (params: CreateDataFieldsParams = {}) => {
    return /* GraphQL */ `
        query GetPublishedPage($id: ID, $path: String, $preview: Boolean, $returnErrorPage: Boolean, $returnNotFoundPage: Boolean) {
            pageBuilder {
                getPublishedPage(id: $id, path: $path, preview: $preview, returnErrorPage: $returnErrorPage, returnNotFoundPage: $returnNotFoundPage) {
                    data ${createDataFields(params)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const GET_PUBLISHED_PAGE = createPageGetPublishedGraphQl();

export const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data {
                    page ${DATA_FIELD}
                    latestPage ${DATA_FIELD}
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
