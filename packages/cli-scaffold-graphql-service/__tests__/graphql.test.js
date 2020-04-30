import { graphql } from "graphql";
import plugins from "../template/src/plugins";
import { createUtils } from "./utils";

describe("Scaffold graphql service test", () => {
    const { useDatabase, useSchema } = createUtils([plugins()]);

    test("graphql", async () => {
        // const query = /* GraphQL */ `
        //     mutation {
        //         files {
        //             createFile(
        //                 data: {
        //                     id: "5c96410bf32d248a1a73b8c3"
        //                     key: "/files/filename.png"
        //                     name: "filename.png"
        //                     size: 123456
        //                     type: "image/png"
        //                     tags: ["sketch"]
        //                 }
        //             ) {
        //                 data {
        //                     id
        //                 }
        //                 error {
        //                     code
        //                     data
        //                     message
        //                 }
        //             }
        //         }
        //     }
        // `;

        const { schema, context } = await useSchema();
        // const response = await graphql(schema, query, {}, context);
    });
});
