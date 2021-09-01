export const DATA_FIELD = /* GraphQL */ `
    {
        id
        data
        status
        createdOn
        createdBy {
            id
            displayName
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

export const CREATE_PAGE_EXPORT_TASK = /* GraphQL */ `
    mutation CreatePageExportTask($data: PbPageExportTaskInput!) {
        pageBuilder {
            createPageExportTask(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE_EXPORT_TASK = /* GraphQL */ `
    mutation UpdatePageExportTask($id: ID!, $data: PbPageExportTaskUpdateInput!) {
        pageBuilder {
            updatePageExportTask(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGE_EXPORT_TASKS = /* GraphQL */ `
    query ListPageExportTasks {
        pageBuilder {
            listPageExportTasks {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_EXPORT_TASK = /* GraphQL */ `
    query GetPageExportTask($id: ID!) {
        pageBuilder {
            getPageExportTask(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE_EXPORT_TASK = /* GraphQL */ `
    mutation DeletePageExportTask($id: ID!) {
        pageBuilder {
            deletePageExportTask(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
