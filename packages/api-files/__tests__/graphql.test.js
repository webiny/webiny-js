import { graphql } from "graphql";
import filesPlugins from "../src/plugins";
import { createUtils } from "./utils";
import mdbid from "mdbid";

describe("files test", () => {
    const { useDatabase, useSchema } = createUtils([filesPlugins()]);

    const db = useDatabase();

    beforeEach(async () => {
        try {
            await db.getCollection("File").drop();
        } catch (err) {
            // if an error is caught, most likely the collection doesn't exist so there is nothing to drop
        }
    });

    test("create file", async () => {
        const query = /* GraphQL */ `
            mutation {
                files {
                    createFile(
                        data: {
                            id: "5c96410bf32d248a1a73b8c3"
                            key: "/files/filename.png"
                            name: "filename.png"
                            size: 123456
                            type: "image/png"
                            tags: ["sketch"]
                        }
                    ) {
                        data {
                            id
                        }
                        error {
                            code
                            data
                            message
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context);

        expect(response).toMatchObject({
            data: {
                files: {
                    createFile: {
                        data: {
                            id: expect.stringMatching("^[0-9a-fA-F]{24}$")
                        }
                    }
                }
            }
        });
    });

    test("list files", async () => {
        await db.getCollection("File").insertMany([
            {
                id: mdbid(),
                key: "/files/filename1.png",
                name: "filename1.png",
                size: 123456,
                type: "image/png",
                tags: ["sketch"]
            },
            {
                id: mdbid(),
                key: "/files/filename2.png",
                name: "filename2.png",
                size: 123456,
                type: "image/png",
                tags: ["avatar"]
            },
            {
                id: mdbid(),
                key: "/files/filename3.png",
                name: "filename3.png",
                size: 123456,
                type: "image/png",
                tags: ["background"]
            }
        ]);

        const query = /* GraphQL */ `
            query ListFiles($after: String) {
                files {
                    listFiles(limit: 1, after: $after) {
                        data {
                            id
                            name
                            size
                            type
                            tags
                            key
                        }
                        meta {
                            cursors {
                                next
                                previous
                            }
                            hasNextPage
                            hasPreviousPage
                            totalCount
                        }
                        error {
                            message
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context);

        if (errors) {
            throw Error(JSON.stringify(errors));
        }

        expect(data).toMatchObject({
            files: {
                listFiles: {
                    data: [
                        {
                            name: "filename3.png",
                            size: 123456,
                            type: "image/png",
                            key: "/files/filename3.png",
                            tags: ["background"]
                        }
                    ],
                    meta: {
                        cursors: {
                            next: expect.any(String),
                            previous: null
                        },
                        hasNextPage: true,
                        hasPreviousPage: false,
                        totalCount: 3
                    }
                }
            }
        });

        const { data: data2, errors: errors2 } = await graphql(schema, query, {}, context, {
            after: data.files.listFiles.meta.cursors.next
        });

        if (errors2) {
            throw Error(JSON.stringify(errors2));
        }

        expect(data2).toMatchObject({
            files: {
                listFiles: {
                    data: [
                        {
                            name: "filename2.png",
                            size: 123456,
                            type: "image/png",
                            key: "/files/filename2.png",
                            tags: ["avatar"]
                        }
                    ],
                    meta: {
                        cursors: {
                            next: expect.any(String),
                            previous: expect.any(String)
                        },
                        hasNextPage: true,
                        hasPreviousPage: true,
                        totalCount: 3
                    }
                }
            }
        });
    });

    test("get file by ID", async () => {
        const id = mdbid();
        await db.getCollection("File").insertMany([
            {
                id,
                key: "/files/filename1.png",
                name: "filename1.png",
                size: 123456,
                type: "image/png",
                tags: ["sketch"]
            }
        ]);

        const query = /* GraphQL */ `
            query GetFileByID($id: ID) {
                files {
                    getFile(id: $id) {
                        data {
                            id
                            name
                            size
                            type
                            key
                            tags
                        }
                        error {
                            message
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const { data, errors } = await graphql(schema, query, {}, context, { id });

        if (errors) {
            throw Error(JSON.stringify(errors));
        }

        expect(data).toMatchObject({
            files: {
                getFile: {
                    data: {
                        id,
                        name: "filename1.png",
                        size: 123456,
                        type: "image/png",
                        key: "/files/filename1.png",
                        tags: ["sketch"]
                    }
                }
            }
        });
    });
});
