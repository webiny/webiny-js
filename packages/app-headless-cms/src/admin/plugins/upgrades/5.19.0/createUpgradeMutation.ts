import gql from "graphql-tag";

export const createUpgradeMutation = () => {
    return gql`
        mutation UpgradeCMS($version: String!) {
            cms {
                upgrade(version: $version) {
                    data
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};
