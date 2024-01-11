import gql from "graphql-tag";
import { PageBuilderImportExportSubTask } from "~/types";

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
        $zipFileUrl: String,
        $meta: JSON
    ) {
        pageBuilder {
            importPages(
                category: $category,
                zipFileUrl: $zipFileUrl,
                meta: $meta
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

export interface GetPageImportExportSubTaskResponse {
    pageBuilder: {
        getImportExportTask: {
            data: PageBuilderImportExportSubTask;
            error?: {
                message: string;
                code: string;
                data: Record<string, any>;
            };
        };
    };
}

export const GET_PAGE_IMPORT_EXPORT_TASK = gql`
    query PbGetPageImportExportTask($id: ID!) {
        pageBuilder {
            getImportExportTask(id: $id) {
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

export interface ListPageImportExportSubTasksResponse {
    pageBuilder: {
        listImportExportSubTask: {
            data: PageBuilderImportExportSubTask[];
            error?: {
                message: string;
                code: string;
                data: Record<string, any>;
            };
        };
    };
}

export const LIST_PAGE_IMPORT_EXPORT_SUB_TASKS = gql`
    query PbPageListPageImportExportSubTask($id: ID!, $status: PbImportExportTaskStatus, $limit: Int) {
        pageBuilder {
            listImportExportSubTask(id: $id, status: $status, limit: $limit) {
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
