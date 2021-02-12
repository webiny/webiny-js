import { gql } from "graphql-request";

export const CREATE_PAGE = gql`
    mutation CreatePage($category: String!) {
        pageBuilder {
            createPage(category: $category) {
                data {
                    id
                }
            }
        }
    }
`;

export const UPDATE_PAGE = gql`
    mutation UpdatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data {
                    id
                }
            }
        }
    }
`;

export const PUBLISH_PAGE = gql`
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                }
            }
        }
    }
`;
