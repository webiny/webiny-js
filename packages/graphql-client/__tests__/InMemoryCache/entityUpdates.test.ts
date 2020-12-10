import { InMemoryCache } from "@webiny/graphql-client";
import getPageMock from "./mocks/getPage.mock";

test.skip("changes must be seen in cached query results", async () => {
    const cache = new InMemoryCache();
    const { result, query, variables } = getPageMock;
    await cache.writeQuery({ query, variables, result });

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

    const entity = cache.readEntity("5fca313c4d426b000841b7d2#1");
    cache.writeEntity("5fca313c4d426b000841b7d2#1", {
        ...entity,
        title: "Untitled-UPDATED",
        status: "published",
        content: "some-content"
    });

    expect(await cache.readQuery({ query, variables })).toEqual({
        pageBuilder: {
            getPage: {
                data: {
                    content: "some-content",
                    createdBy: {
                        id: "a@webiny.com"
                    },
                    id: "5fca313c4d426b000841b7d2#1",
                    locked: false,
                    revisions: [
                        {
                            id: "5fca313c4d426b000841b7d2#1",
                            savedOn: "2020-12-04T12:53:16.575Z",
                            status: "published",
                            title: "Untitled-UPDATED",
                            version: 1
                        }
                    ],
                    status: "published",
                    title: "Untitled-UPDATED",
                    url: "/blogs/untitled-kia9qvtr",
                    version: 1
                },
                error: null
            }
        }
    });
});
