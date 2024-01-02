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

export const IMPORT_BLOCKS = gql`
    mutation PbImportBlock(
        $zipFileUrl: String
    ) {
        pageBuilder {
            importBlocks(
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

export const EXPORT_BLOCKS = gql`
    mutation PbExportBlocks(
        $ids: [ID!],
        $where: PbListPageBlocksWhereInput
    ) {
        pageBuilder {
            exportBlocks(
                ids: $ids,
                where: $where
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

export interface GetBlockImportExportTaskResponse {
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

export const GET_BLOCK_IMPORT_EXPORT_TASK = gql`
    query PbGetBlockImportExportTask($id: ID!) {
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

export interface ListBlockImportExportSubTasksResponse {
    pageBuilder: {
        listPageImportExportSubTask: {
            data: PageBuilderImportExportSubTask[];
            error?: {
                message: string;
                code: string;
                data: Record<string, any>;
            };
        };
    };
}

export const LIST_BLOCK_IMPORT_EXPORT_SUB_TASKS = gql`
    query PbBlockListBlockImportExportSubTask($id: ID!, $status: PbImportExportTaskStatus, $limit: Int) {
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
