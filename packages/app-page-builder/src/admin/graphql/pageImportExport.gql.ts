import gql from "graphql-tag";
import { PageBuilderImportExportSubTask, PbErrorResponse } from "~/types";
import {
    CreatedBy,
    PbImportExportTaskData,
    PbListPagesSearchInput,
    PbListPagesWhereInput,
    PbTaskStatus
} from "./types";
import { PbRevisionType } from "~/contexts/PageBuilder";

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

export interface ExportPagesVariables {
    revisionType: PbRevisionType;
    where?: PbListPagesWhereInput;
    limit?: number;
    sort?: string[];
    search?: PbListPagesSearchInput;
}

export interface ExportPagesResponseDataTask {
    id: string;
    createdOn: string;
    createdBy: CreatedBy;
    status: PbTaskStatus;
    data: PbImportExportTaskData;
    stats: {
        total: number;
        completed: number;
        failed: number;
    };
}

export interface ExportPagesResponseData {
    task: ExportPagesResponseDataTask;
}

export interface ExportPagesResponse {
    pageBuilder: {
        exportPages: {
            data: ExportPagesResponseData | null;
            error: PbErrorResponse | null;
        };
    };
}

export const EXPORT_PAGES = gql`
    mutation PbExportPages(
        $revisionType: PbExportPageRevisionType!,
        $where: PbListPagesWhereInput,
        $sort: [PbListPagesSort!],
        $search: PbListPagesSearchInput
    ) {
        pageBuilder {
            exportPages(
                revisionType: $revisionType,
                where: $where,
                sort: $sort,
                search: $search
            ) {
                data {
                    task {
                        id
                        status
                        ${STATS}
                    }
                }
                ${ERROR}
            }
        }
    }
`;

export interface GetPageExportTaskVariables {
    id: string;
}

export interface GetPageExportTaskResponse {
    pageBuilder: {
        getExportTask: {
            data?: ExportPagesResponseDataTask;
            error?: PbErrorResponse;
        };
    };
}

export const GET_PAGE_EXPORT_TASK = gql`
    query PbGetPageExportTask($id: ID!) {
        pageBuilder {
            getExportTask(id: $id) {
                data {
                    id
                    status
                    createdOn
                    data {
                        error {
                            message
                            code
                            data
                        }
                        url
                    }
                    stats {
                        total
                        completed
                        failed
                    }
                }
                ${ERROR}
            }
        }
    }
`;

export interface PageImportExportTaskResponse {
    pageBuilder: {
        getImportExportTask: {
            data?: ExportPagesResponseDataTask;
            error?: PbErrorResponse;
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
