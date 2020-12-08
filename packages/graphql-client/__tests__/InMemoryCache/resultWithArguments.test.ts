import { InMemoryCache } from "@webiny/graphql-client";
import getPageMock from "./mocks/getPage.mock";

test("must properly cache results from queries that included args", async () => {
    const cache = new InMemoryCache();
    const { result, query, variables } = getPageMock;
    await cache.writeQuery({ query, variables, result });

    expect(cache.export()).toEqual({
        queries: {
            "2229900970": {
                "815942322": {
                    pageBuilder: {
                        getPage: {
                            data: {
                                __entity: {
                                    id: "5fca313c4d426b000841b7d2#1",
                                    fields: [
                                        "id",
                                        "title",
                                        "url",
                                        "version",
                                        "locked",
                                        "status",
                                        "content"
                                    ]
                                },
                                revisions: [
                                    {
                                        __entity: {
                                            id: "5fca313c4d426b000841b7d2#1",
                                            fields: ["id", "savedOn", "title", "status", "version"]
                                        }
                                    }
                                ],
                                createdBy: {
                                    __entity: {
                                        id: "a@webiny.com",
                                        fields: ["id"]
                                    }
                                }
                            },
                            error: null
                        }
                    }
                }
            }
        },
        entities: {
            "5fca313c4d426b000841b7d2#1": {
                id: "5fca313c4d426b000841b7d2#1",
                title: "Untitled",
                url: "/blogs/untitled-kia9qvtr",
                version: 1,
                locked: false,
                status: "draft",
                content: null,
                savedOn: "2020-12-04T12:53:16.575Z"
            },
            "a@webiny.com": {
                id: "a@webiny.com"
            }
        }
    });

    expect(await cache.readQuery({ query, variables })).toEqual({
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
    });

    expect(cache.readEntity("5fca313c4d426b000841b7d2#1")).toEqual({
        id: "5fca313c4d426b000841b7d2#1",
        title: "Untitled",
        url: "/blogs/untitled-kia9qvtr",
        version: 1,
        locked: false,
        status: "draft",
        content: null,
        savedOn: "2020-12-04T12:53:16.575Z"
    });
});
