import gql from "graphql-tag";
import { PbErrorResponse } from "~/types";
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

export interface ImportPagesMutationVariables {
    category: string;
    zipFileUrl?: string;
    meta?: Record<string, any>;
}

export interface ImportPagesMutationResponseDataTask {
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
export interface ImportPagesMutationResponseData {
    task: ImportPagesMutationResponseDataTask;
}

export interface ImportPagesMutationResponse {
    pageBuilder: {
        importPages: {
            data: ImportPagesMutationResponseData | null;
            error: PbErrorResponse | null;
        };
    };
}

export const IMPORT_PAGES = gql`
    mutation PbImportPage(
        $category: String!,
        $zipFileUrl: String!,
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
        getExportPagesTask: {
            data?: ExportPagesResponseDataTask;
            error?: PbErrorResponse;
        };
    };
}

export const GET_PAGE_EXPORT_TASK = gql`
    query PbGetPageExportTask($id: ID!) {
        pageBuilder {
            getExportPagesTask(id: $id) {
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

export interface GetPagesImportTaskVariables {
    id: string;
}

export interface GetPagesImportTaskResponseDataData {
    error?: PbErrorResponse;
}

export interface GetPagesImportTaskResponseData {
    id: string;
    status: PbTaskStatus;
    createdOn: string;
    stats: {
        total: number;
        completed: number;
        failed: number;
    };
    data: GetPagesImportTaskResponseDataData;
}

export interface GetPagesImportTaskResponse {
    pageBuilder: {
        getImportPagesTask: {
            data?: GetPagesImportTaskResponseData;
            error?: PbErrorResponse;
        };
    };
}

export const GET_PAGES_IMPORT_TASK = gql`
    query PbGetPagesImportTask($id: ID!) {
        pageBuilder {
            getImportPagesTask(id: $id) {
                data {
                    id
                    status
                    createdOn
                    ${STATS}
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

export interface ListImportedPagesVariables {
    taskId: string;
}

export interface ImportedPage {
    id: string;
    title: string;
    version: number;
}

export interface ListImportedPagesResponse {
    pageBuilder: {
        listImportedPages: {
            data?: ImportedPage[];
            error?: PbErrorResponse;
        };
    };
}

export const LIST_IMPORTED_PAGES = gql`
    query PbListImportedPages($taskId: ID!) {
        pageBuilder {
            listImportedPages(taskId: $taskId) {
                data {
                    id
                    title
                    version
                }
                ${ERROR}
            }
        }
    }
`;
