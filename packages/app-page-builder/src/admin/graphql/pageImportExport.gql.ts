import gql from "graphql-tag";

const ERROR = `
error {   
    code
    message
    data
}    
`;

const STATS = `
stats {
    total
    processing
    pending
    completed
    failed
}`;

export const IMPORT_PAGES = gql`
    mutation PbImportPage($category: String!, $data: PbImportPageInput!) {
        pageBuilder {
            importPages(category: $category, data: $data) {
                data {
                    task {
                        id
                        status
                        data
                        ${STATS}
                    }
                }
                ${ERROR}
            }
        }
    }
`;

export const EXPORT_PAGES = gql`
    mutation PbExportPages($ids: [ID]!, $revisionType: PbExportPageRevisionType) {
        pageBuilder {
            exportPages(ids: $ids, revisionType: $revisionType) {
                data {
                    task {
                        id
                        status
                        data
                        ${STATS}
                    }
                }
                ${ERROR}
            }
        }
    }
`;

export const GET_PAGE_IMPORT_EXPORT_TASK = gql`
    query PbGetPageImportExportTask($id: ID!) {
        pageBuilder {
            getPageImportExportTask(id: $id) {
                data {
                    status
                    data
                    ${STATS}
                }
                ${ERROR}
            }
        }
    }
`;

export const GET_PAGE_IMPORT_EXPORT_TASK_BY_STATUS = gql`
    query PbPageGetImportExportSubTaskByStatus($id: ID!, $status: PbPageImportExportTaskStatus) {
        pageBuilder {
            getPageImportExportSubTaskByStatus(id: $id, status: $status) {
                data {
                    id
                    status
                    data
                }
                ${ERROR}
            }
        }
    }
`;
