import gql from "graphql-tag";

/**
 * ###########################
 * List Icon Files Query Response
 */
export interface ListIconFilesQueryResponse {
    fileManager: {
        listFiles: {
            data: [{ name: string; src: string }] | null;
            error: { message: string; data: Record<string, any>; code: string } | null;
        };
    };
}

export const LIST_ICON_FILES = gql`
    query ListIconFiles {
        fileManager {
            listFiles(where: { tags_contains: "scope:iconPicker" }) {
                data {
                    name
                    src
                    tags
                }
            }
        }
    }
`;
