import useGqlHandler from "./useGqlHandler";
import mdbid from "mdbid";

describe("CRUD Test", () => {
    const { invoke, database } = useGqlHandler();

    afterEach(async () => {
        await database.collection("File").remove({}, { multi: true });
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

        const [response] = await invoke({ body: { query } });

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
        await database.collection("File").insert([
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

        const [response] = await invoke({ body: { query } });

        expect(response.data).toMatchObject({
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

        const [response2] = await invoke({
            body: {
                query,
                variables: {
                    after: response.data.files.listFiles.meta.cursors.next
                }
            }
        });

        expect(response2.data).toMatchObject({
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
        await database.collection("File").insert([
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

        const [response] = await invoke({
            body: {
                query,
                variables: { id }
            }
        });

        expect(response.data).toMatchObject({
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
