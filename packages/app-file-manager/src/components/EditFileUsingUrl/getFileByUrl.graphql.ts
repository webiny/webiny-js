import gql from "graphql-tag";
import { useFileModel } from "~/hooks/useFileModel";
import { getFileGraphQLSelection } from "~/modules/FileManagerApiProvider/FileManagerApiContext";

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
