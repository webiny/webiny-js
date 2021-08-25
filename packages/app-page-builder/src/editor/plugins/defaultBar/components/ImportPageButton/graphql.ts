import gql from "graphql-tag";

export const IMPORT_PAGE = gql`
    mutation PbImportPage($id: ID!, $data: PbImportPageInput!) {
        pageBuilder {
            importPage(id: $id, data: $data) {
                data {
                    title
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
