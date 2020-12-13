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
                        locked
                        __typename
                    }
                    createdBy {
                        id
                        __typename
                    }
                    content
                    __typename
                }
                error {
                    code
                    message
                    __typename
                }
                __typename
            }
            __typename
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
                    id: "5fd0ced4a4e43b0008f89541#7",
                    title: "NOVO 123123",
                    url: "undefineduntitled-123",
                    version: 7,
                    locked: true,
                    status: "published",
                    revisions: [
                        {
                            id: "5fd0ced4a4e43b0008f89541#1",
                            savedOn: "2020-12-09T13:19:40.485Z",
                            title: "NOVO 123123",
                            status: "unpublished",
                            version: 1,
                            __typename: "PbPageRevision"
                        },
                        {
                            id: "5fd0ced4a4e43b0008f89541#2",
                            savedOn: "2020-12-09T13:21:56.269Z",
                            title: "NOVO 123123",
                            status: "draft",
                            version: 2,
                            __typename: "PbPageRevision"
                        },
                        {
                            id: "5fd0ced4a4e43b0008f89541#3",
                            savedOn: "2020-12-09T13:25:56.856Z",
                            title: "NOVO 123123",
                            status: "unpublished",
                            version: 3,
                            __typename: "PbPageRevision"
                        },
                        {
                            id: "5fd0ced4a4e43b0008f89541#4",
                            savedOn: "2020-12-09T13:28:32.288Z",
                            title: "NOVO 123123",
                            status: "unpublished",
                            version: 4,
                            __typename: "PbPageRevision"
                        },
                        {
                            id: "5fd0ced4a4e43b0008f89541#5",
                            savedOn: "2020-12-09T13:28:53.639Z",
                            title: "NOVO 123123",
                            status: "unpublished",
                            version: 5,
                            __typename: "PbPageRevision"
                        },
                        {
                            id: "5fd0ced4a4e43b0008f89541#6",
                            savedOn: "2020-12-09T13:30:05.296Z",
                            title: "NOVO 123123",
                            status: "unpublished",
                            version: 6,
                            __typename: "PbPageRevision"
                        },
                        {
                            id: "5fd0ced4a4e43b0008f89541#7",
                            savedOn: "2020-12-09T13:32:57.602Z",
                            title: "NOVO 123123",
                            status: "published",
                            version: 7,
                            __typename: "PbPageRevision"
                        }
                    ],
                    createdBy: { id: "adm@webiny.com", __typename: "PbCreatedBy" },
                    content: {
                        path: "0",
                        id: "aQQTTrJBj",
                        data: { settings: {} },
                        type: "document",
                        elements: [
                            {
                                path: "0.0",
                                id: "HSX0QN-4Xf",
                                data: {
                                    settings: {
                                        width: { value: "1000px" },
                                        padding: { mobile: { all: 10 }, desktop: { all: 0 } },
                                        margin: {
                                            mobile: {
                                                right: 15,
                                                top: 15,
                                                left: 15,
                                                bottom: 15
                                            },
                                            advanced: true,
                                            desktop: { right: 0, top: 25, left: 0, bottom: 25 }
                                        }
                                    }
                                },
                                type: "block",
                                elements: []
                            }
                        ]
                    },
                    __typename: "PbPage"
                },
                error: null,
                __typename: "PbPageResponse"
            },
            __typename: "PbQuery"
        }
    }
};
