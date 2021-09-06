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

export const CREATE_EXPORT_PAGE_TASK = /* GraphQL */ `
    mutation CreateExportPageTask($data: PbExportPageTaskInput!) {
        pageBuilder {
            createExportPageTask(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_EXPORT_PAGE_TASK = /* GraphQL */ `
    mutation UpdateExportPageTask($id: ID!, $data: PbExportPageTaskUpdateInput!) {
        pageBuilder {
            updateExportPageTask(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_EXPORT_PAGE_TASKS = /* GraphQL */ `
    query ListExportPageTasks {
        pageBuilder {
            listExportPageTasks {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_EXPORT_PAGE_TASK = /* GraphQL */ `
    query GetExportPageTask($id: ID!) {
        pageBuilder {
            getExportPageTask(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_EXPORT_PAGE_TASK = /* GraphQL */ `
    mutation DeleteExportPageTask($id: ID!) {
        pageBuilder {
            deleteExportPageTask(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
