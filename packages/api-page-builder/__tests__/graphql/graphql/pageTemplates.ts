export const DATA_FIELD = /* GraphQL */ `
    {
        id
        content
        createdOn
        createdBy {
            id
            displayName
            type
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_PAGE_TEMPLATE = /* GraphQL */ `
    mutation CreatePageTemplate($data: PbCreatePageTemplateInput!) {
        pageBuilder {
            createPageTemplate(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE_TEMPLATE = /* GraphQL */ `
    mutation UpdatePageTemplate($id: ID!, $data: PbUpdatePageTemplateInput!) {
        pageBuilder {
            updatePageTemplate(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGE_TEMPLATES = /* GraphQL */ `
    query ListPageTemplates($where: PbListPageTemplatesWhereInput) {
        pageBuilder {
            listPageTemplates(where: $where) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_TEMPLATE = /* GraphQL */ `
    query GetPageTemplate($id: ID!) {
        pageBuilder {
            getPageTemplate(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE_TEMPLATE = /* GraphQL */ `
    mutation DeletePageTemplate($id: ID!) {
        pageBuilder {
            deletePageTemplate(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_PAGE_FROM_TEMPLATE = /* GraphQL */ `
    mutation CreatePageFromTemplate($templateId: ID!, $meta: JSON) {
        pageBuilder {
            createPageFromTemplate(templateId: $templateId, meta: $meta) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
