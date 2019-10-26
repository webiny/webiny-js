import { graphql } from "graphql";
import { MongoClient } from "mongodb";
import { createHandler, PluginsContainer } from "@webiny/api";
import filesPlugins from "@webiny/api-files/plugins";

// Configure default storage
let config;

describe("GraphQL plugins", () => {
    let schema;
    let context;

    beforeAll(async () => {
        // Setup database
        const client = await MongoClient.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        config = { client, database: await client.db(global.__MONGO_DB_NAME__) };

        // Configure schema
        const appConfig = { database: { mongodb: config.database } };
        const plugins = new PluginsContainer([filesPlugins(appConfig)]);

        schema = (await createHandler({ plugins, config: appConfig })).schema;

        context = {
            config,
            plugins,
            getDatabase: () => config.database
        };
    });

    afterAll(async () => {
        await config.client.close();
        await config.database.close();
    });

    test("create file", async () => {
        const query = /* GraphQL */ `
            mutation {
                files {
                    createFile(
                        data: {
                            id: "5c96410bf32d248a1a73b8c3"
                            key: "filename.png"
                            name: "filename.png"
                            size: 123456
                            type: "image/png"
                            src: "/files/filename.png"
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
        const query = /* GraphQL */ `
            {
                files {
                    listFiles(perPage: 1) {
                        data {
                            id
                            name
                            size
                            type
                            src
                            tags
                        }
                    }
                }
            }
        `;

        const response = await graphql(schema, query, {}, context);
        expect(response).toMatchObject({
            data: {
                files: {
                    listFiles: {
                        data: [
                            {
                                id: "5c96410bf32d248a1a73b8c3",
                                name: "filename.png",
                                size: 123456,
                                type: "image/png",
                                src: "/files/filename.png",
                                tags: ["sketch"]
                            }
                        ]
                    }
                }
            }
        });
    });

    test("get file by ID", async () => {
        const query = /* GraphQL */ `
            {
                files {
                    getFile(id: "5c96410bf32d248a1a73b8c3") {
                        data {
                            id
                            name
                            size
                            type
                            src
                            tags
                        }
                    }
                }
            }
        `;

        const response = await graphql(schema, query, {}, context);
        expect(response).toMatchObject({
            data: {
                files: {
                    getFile: {
                        data: {
                            id: "5c96410bf32d248a1a73b8c3",
                            name: "filename.png",
                            size: 123456,
                            type: "image/png",
                            src: "/files/filename.png",
                            tags: ["sketch"]
                        }
                    }
                }
            }
        });
    });

    test("list tags", async () => {
        const query = /* GraphQL */ `
            {
                files {
                    listTags
                }
            }
        `;

        const response = await graphql(schema, query, {}, context);
        expect(response).toMatchObject({
            data: {
                files: {
                    listTags: ["sketch"]
                }
            }
        });
    });
});
