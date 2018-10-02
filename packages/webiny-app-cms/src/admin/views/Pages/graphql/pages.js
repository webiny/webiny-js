import gql from "graphql-tag";

export const loadEditorData = gql`
    query GetEditorData($page: ID!, $revision: ID!) {
        Cms {
            Pages {
                one(id: $page) {
                    id
                    status
                    category {
                        id
                        name
                        url
                    }
                    revisions {
                        id
                        name
                        published
                        locked
                    }
                }
            }
            Revisions {
                one(id: $revision) {
                    id
                    name
                    published
                    locked
                    title
                    slug
                    content
                    settings
                }
            }
        }
    }
`;

// TODO: convert to mutation
export const createPage = gql`
    query CreatePage($category: ID!, $title: String) {
        Cms {
            Pages {
                create(data: { category: $category, title: $title }) {
                    id
                    activeRevision {
                        id
                    }
                }
            }
        }
    }
`;
