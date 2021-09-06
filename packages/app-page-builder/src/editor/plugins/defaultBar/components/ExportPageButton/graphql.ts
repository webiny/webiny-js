import gql from "graphql-tag";

export const EXPORT_PAGE = gql`
    mutation PbExportPage($id: ID!) {
        pageBuilder {
            exportPage(id: $id) {
                data {
                    taskId
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const GET_EXPORT_PAGE_TASK = gql`
    query PbGetExportPageTask($id: ID!) {
        pageBuilder {
            getExportPageTask(id: $id) {
                data {
                    status
                    data
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
