import InMemoryCache from "@webiny/graphql-client/InMemoryCache";
import getPageMock from "./mocks/getPage.mock";

test("changes must be seen in cached query results", async () => {
    const cache = new InMemoryCache();
    const { result, query, variables } = getPageMock;
    await cache.writeQuery({ query, variables, result });

    const entity = cache.readEntity({
        typename: "PbPage",
        id: "5fd0ced4a4e43b0008f89541#7"
    });

    cache.writeEntity(
        {
            typename: "PbPage",
            id: "5fd0ced4a4e43b0008f89541#7"
        },
        {
            ...entity,
            title: "Untitled-UPDATED",
            status: "published",
            content: "some-content"
        }
    );

    expect(await cache.readQuery({ query, variables })).toEqual({
        pageBuilder: {
            __typename: "PbQuery",
            getPage: {
                __typename: "PbPageResponse",
                data: {
                    __typename: "PbPage",
                    content: "some-content",
                    createdBy: {
                        __typename: "PbCreatedBy",
                        id: "adm@webiny.com"
                    },
                    id: "5fd0ced4a4e43b0008f89541#7",
                    locked: true,
                    revisions: [
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#1",
                            savedOn: "2020-12-09T13:19:40.485Z",
                            status: "unpublished",
                            title: "NOVO 123123",
                            version: 1
                        },
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#2",
                            savedOn: "2020-12-09T13:21:56.269Z",
                            status: "draft",
                            title: "NOVO 123123",
                            version: 2
                        },
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#3",
                            savedOn: "2020-12-09T13:25:56.856Z",
                            status: "unpublished",
                            title: "NOVO 123123",
                            version: 3
                        },
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#4",
                            savedOn: "2020-12-09T13:28:32.288Z",
                            status: "unpublished",
                            title: "NOVO 123123",
                            version: 4
                        },
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#5",
                            savedOn: "2020-12-09T13:28:53.639Z",
                            status: "unpublished",
                            title: "NOVO 123123",
                            version: 5
                        },
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#6",
                            savedOn: "2020-12-09T13:30:05.296Z",
                            status: "unpublished",
                            title: "NOVO 123123",
                            version: 6
                        },
                        {
                            __typename: "PbPageRevision",
                            id: "5fd0ced4a4e43b0008f89541#7",
                            savedOn: "2020-12-09T13:32:57.602Z",
                            status: "published",
                            title: "NOVO 123123",
                            version: 7
                        }
                    ],
                    status: "published",
                    title: "Untitled-UPDATED",
                    url: "undefineduntitled-123",
                    version: 7
                },
                error: null
            }
        }
    });
});
