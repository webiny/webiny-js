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
    mutation PbImportPage(
        $category: String!,
        $zipFileKey: String,
        $zipFileUrl: String
    ) {
        pageBuilder {
            importPages(
                category: $category,
                zipFileKey: $zipFileKey,
                zipFileUrl: $zipFileUrl
            ) {
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
    mutation PbExportPages(
        $ids: [ID!],
        $revisionType: PbExportPageRevisionType!,
        $where: PbListPagesWhereInput,
        $sort: [PbListPagesSort!],
        $search: PbListPagesSearchInput
    ) {
        pageBuilder {
            exportPages(
                ids: $ids,
                revisionType: $revisionType,
                where: $where,
                sort: $sort,
                search: $search
            ) {
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
                    error
                    ${STATS}
                }
                ${ERROR}
            }
        }
    }
`;

export const LIST_PAGE_IMPORT_EXPORT_SUB_TASKS = gql`
    query PbPageListPageImportExportSubTask($id: ID!, $status: PbPageImportExportTaskStatus, $limit: Int) {
        pageBuilder {
            listPageImportExportSubTask(id: $id, status: $status, limit: $limit) {
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
