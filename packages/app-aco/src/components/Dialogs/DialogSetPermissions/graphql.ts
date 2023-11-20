import gql from "graphql-tag";

export const LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS = gql`
    query ListFolderLevelPermissionsTargets {
        aco {
            listFolderLevelPermissionsTargets {
                data {
                    id
                    type
                    target
                    name
                    meta
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;
