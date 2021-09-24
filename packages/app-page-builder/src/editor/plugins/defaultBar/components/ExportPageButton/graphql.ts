import gql from "graphql-tag";

export const EXPORT_PAGES = gql`
    mutation PbExportPages($ids: [ID]!) {
        pageBuilder {
            exportPages(ids: $ids) {
                data {
                    task {
                        id
                        status
                        stats
                        data
                    }
                }
                error {
                    code
                    message
                }
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
                    stats
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
