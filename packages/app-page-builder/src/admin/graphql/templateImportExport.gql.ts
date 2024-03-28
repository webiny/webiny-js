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
}
`;

export const IMPORT_TEMPLATES = gql`
    mutation PbImportTemplate($zipFileUrl: String) {
        pageBuilder {
            importTemplates(zipFileUrl: $zipFileUrl) {
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

export const EXPORT_TEMPLATES = gql`
    mutation PbExportTemplates(
        $ids: [ID!]
    ) {
        pageBuilder {
            exportTemplates(
                ids: $ids
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

export interface GetTemplateImportExportTaskResponse {
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

export const GET_TEMPLATE_IMPORT_EXPORT_TASK = gql`
    query PbGetTemplateImportExportTask($id: ID!) {
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

export interface ListTemplateImportExportSubTasksResponse {
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

export const LIST_TEMPLATE_IMPORT_EXPORT_SUB_TASKS = gql`
    query PbPageListTemplateImportExportSubTask($id: ID!, $status: PbImportExportTaskStatus, $limit: Int) {
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
