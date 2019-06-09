// @flow
import gql from "graphql-tag";

export const getForm = gql`
    query GetForm($id: ID!) {
        forms {
            getForm(id: $id) {
                data {
                    id
                    name
                    version
                    fields
                    layout
                    settings {
                        layout {
                            renderer
                        }
                    }
                    triggers
                    revisions {
                        id
                        name
                        published
                        version
                    }
                }
            }
        }
    }
`;

export const updateRevision = gql`
    mutation UpdateForm($id: ID!, $data: UpdateFormInput!) {
        forms {
            updateRevision(id: $id, data: $data) {
                data {
                    id
                    name
                    version
                    fields
                    layout
                    settings {
                        layout {
                            renderer
                        }
                    }
                    triggers
                }
            }
        }
    }
`;
