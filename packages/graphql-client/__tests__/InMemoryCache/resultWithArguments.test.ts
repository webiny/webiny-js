import { InMemoryCache } from "@webiny/graphql-client";
import getPageMock from "./mocks/getPage.mock";

test("must properly cache results from queries that included args", async () => {
    const cache = new InMemoryCache();
    const { result, query, variables } = getPageMock;
    await cache.writeQuery({ query, variables, result });

    expect(cache.export()).toEqual({
        entities: {
            PbCreatedBy: {
                "adm@webiny.com": {
                    id: "adm@webiny.com"
                }
            },
            PbPage: {
                "5fd0ced4a4e43b0008f89541#7": {
                    content: {
                        data: {
                            settings: {}
                        },
                        elements: [
                            {
                                data: {
                                    settings: {
                                        margin: {
                                            advanced: true,
                                            desktop: {
                                                bottom: 25,
                                                left: 0,
                                                right: 0,
                                                top: 25
                                            },
                                            mobile: {
                                                bottom: 15,
                                                left: 15,
                                                right: 15,
                                                top: 15
                                            }
                                        },
                                        padding: {
                                            desktop: {
                                                all: 0
                                            },
                                            mobile: {
                                                all: 10
                                            }
                                        },
                                        width: {
                                            value: "1000px"
                                        }
                                    }
                                },
                                elements: [],
                                id: "HSX0QN-4Xf",
                                path: "0.0",
                                type: "block"
                            }
                        ],
                        id: "aQQTTrJBj",
                        path: "0",
                        type: "document"
                    },
                    id: "5fd0ced4a4e43b0008f89541#7",
                    locked: true,
                    status: "published",
                    title: "NOVO 123123",
                    url: "undefineduntitled-123",
                    version: 7
                }
            },
            PbPageRevision: {
                "5fd0ced4a4e43b0008f89541#1": {
                    id: "5fd0ced4a4e43b0008f89541#1",
                    savedOn: "2020-12-09T13:19:40.485Z",
                    status: "unpublished",
                    title: "NOVO 123123",
                    version: 1
                },
                "5fd0ced4a4e43b0008f89541#2": {
                    id: "5fd0ced4a4e43b0008f89541#2",
                    savedOn: "2020-12-09T13:21:56.269Z",
                    status: "draft",
                    title: "NOVO 123123",
                    version: 2
                },
                "5fd0ced4a4e43b0008f89541#3": {
                    id: "5fd0ced4a4e43b0008f89541#3",
                    savedOn: "2020-12-09T13:25:56.856Z",
                    status: "unpublished",
                    title: "NOVO 123123",
                    version: 3
                },
                "5fd0ced4a4e43b0008f89541#4": {
                    id: "5fd0ced4a4e43b0008f89541#4",
                    savedOn: "2020-12-09T13:28:32.288Z",
                    status: "unpublished",
                    title: "NOVO 123123",
                    version: 4
                },
                "5fd0ced4a4e43b0008f89541#5": {
                    id: "5fd0ced4a4e43b0008f89541#5",
                    savedOn: "2020-12-09T13:28:53.639Z",
                    status: "unpublished",
                    title: "NOVO 123123",
                    version: 5
                },
                "5fd0ced4a4e43b0008f89541#6": {
                    id: "5fd0ced4a4e43b0008f89541#6",
                    savedOn: "2020-12-09T13:30:05.296Z",
                    status: "unpublished",
                    title: "NOVO 123123",
                    version: 6
                },
                "5fd0ced4a4e43b0008f89541#7": {
                    id: "5fd0ced4a4e43b0008f89541#7",
                    savedOn: "2020-12-09T13:32:57.602Z",
                    status: "published",
                    title: "NOVO 123123",
                    version: 7
                }
            }
        },
        queries: {
            "1989523961": {
                "815942322": {
                    pageBuilder: {
                        __typename: "PbQuery",
                        getPage: {
                            __typename: "PbPageResponse",
                            data: {
                                __entity: {
                                    fields: [
                                        "id",
                                        "title",
                                        "url",
                                        "version",
                                        "locked",
                                        "status",
                                        "content"
                                    ],
                                    id: "5fd0ced4a4e43b0008f89541#7"
                                },
                                __typename: "PbPage",
                                createdBy: {
                                    __entity: {
                                        fields: ["id"],
                                        id: "adm@webiny.com"
                                    },
                                    __typename: "PbCreatedBy"
                                },
                                revisions: [
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#1"
                                        },
                                        __typename: "PbPageRevision"
                                    },
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#2"
                                        },
                                        __typename: "PbPageRevision"
                                    },
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#3"
                                        },
                                        __typename: "PbPageRevision"
                                    },
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#4"
                                        },
                                        __typename: "PbPageRevision"
                                    },
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#5"
                                        },
                                        __typename: "PbPageRevision"
                                    },
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#6"
                                        },
                                        __typename: "PbPageRevision"
                                    },
                                    {
                                        __entity: {
                                            fields: ["id", "savedOn", "title", "status", "version"],
                                            id: "5fd0ced4a4e43b0008f89541#7"
                                        },
                                        __typename: "PbPageRevision"
                                    }
                                ]
                            },
                            error: null
                        }
                    }
                }
            }
        }
    });

    expect(cache.readQuery({ query, variables })).toEqual(getPageMock.result);

    expect(cache.readEntity("PbCreatedBy", "adm@webiny.com")).toEqual({
        id: "adm@webiny.com"
    });

    expect(cache.readEntity("PbPageRevision", "5fd0ced4a4e43b0008f89541#3")).toEqual({
        id: "5fd0ced4a4e43b0008f89541#3",
        savedOn: "2020-12-09T13:25:56.856Z",
        status: "unpublished",
        title: "NOVO 123123",
        version: 3
    });
});
