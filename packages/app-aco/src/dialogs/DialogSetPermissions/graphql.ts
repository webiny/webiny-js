import gql from "graphql-tag";
import type {FolderLevelPermissionsTarget} from "~/types.js";

export interface IListFolderLevelPermissionsTargetsResponse {
    aco: {
        listFolderLevelPermissionsTargets: {
            data: FolderLevelPermissionsTarget[] | null;
            error: Error | null;
        }
    }}

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
