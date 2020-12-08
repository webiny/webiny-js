import gql from "graphql-tag";

export const GET_PAGE = gql`
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data {
                    id
                    title
                    url
                    version
                    locked
                    status
                    revisions {
                        id
                        savedOn
                        title
                        status
                        version
                    }
                    createdBy {
                        id
                    }
                    content
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export default {
    query: GET_PAGE,
    variables: {
        id: "5fca313c4d426b000841b7d2%231"
    },
    result: {
        pageBuilder: {
            getPage: {
                data: {
                    id: "5fca313c4d426b000841b7d2#1",
                    title: "Untitled",
                    url: "/blogs/untitled-kia9qvtr",
                    version: 1,
                    locked: false,
                    status: "draft",
                    revisions: [
                        {
                            id: "5fca313c4d426b000841b7d2#1",
                            savedOn: "2020-12-04T12:53:16.575Z",
                            title: "Untitled",
                            status: "draft",
                            version: 1
                        }
                    ],
                    createdBy: { id: "a@webiny.com" },
                    content: null
                },
                error: null
            }
        }
    }
};
