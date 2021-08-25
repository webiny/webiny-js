import gql from "graphql-tag";

export const EXPORT_PAGE = gql`
    mutation PbExportPage($id: ID!) {
        pageBuilder {
            exportPage(id: $id) {
                data {
                    pageZipUrl
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
