import gql from "graphql-tag";
import type { useFileModel } from "~/hooks/useFileModel.js";
import { getFileGraphQLSelection } from "~/modules/FileManagerApiProvider/FileManagerApiContext/index.js";

export const getFileByUrlQuery = (model: ReturnType<typeof useFileModel>) => {
    return gql`
        query GetFileByUrl($url: String!) {
            fileManager {
                getFileByUrl(url: $url) {
                    data ${getFileGraphQLSelection(model)}
                    error {
                        code
                        message
                    }
                }
            }
        }
    `;
};
