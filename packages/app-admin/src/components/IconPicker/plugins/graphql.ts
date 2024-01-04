import gql from "graphql-tag";

/**
 * ###########################
 * List Custom Icons Query Response
 */
export interface ListCustomIconsQueryResponse {
    fileManager: {
        listFiles: {
            data: [{ name: string; src: string }] | null;
            error: { message: string; data: Record<string, any>; code: string } | null;
        };
    };
}

export const LIST_CUSTOM_ICONS = gql`
    query ListCustomIcons($limit: Int!) {
        fileManager {
            listFiles(where: { tags_startsWith: "scope:iconPicker" }, limit: $limit) {
                data {
                    name
                    src
                    tags
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
