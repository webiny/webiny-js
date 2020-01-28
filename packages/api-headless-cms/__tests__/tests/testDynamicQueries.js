import { graphql } from "graphql";
import { setupSchema } from "@webiny/api/testing";
import headlessPlugins from "../../src/plugins";
import insertTestData from "./insertTestData";

export default ({ plugins }) => {
    let testing;

    beforeAll(async () => {
        // Setup schema
        testing = await setupSchema([plugins, headlessPlugins()]);
        await insertTestData(testing);

        // Recreate schema with dynamic content models
        //testing = await setupSchema([plugins, headlessPlugins()]);
    });

    test("dynamic GQL types", async () => {});

    // test("dynamic GQL types", async () => {
    //     const query = /* GraphQL */ `
    //         {
    //             __schema {
    //                 types {
    //                     name
    //                 }
    //             }
    //         }
    //     `;

    //     const response = await graphql(testing.schema, query, {}, testing.context);

    //     console.log(JSON.stringify(response, null, 2));

    //     expect(response).toMatchObject({
    //         data: {
    //             cmsManage: {
    //                 createContentModel: {
    //                     data: {
    //                         id: expect.stringMatching("^[0-9a-fA-F]{24}$"),
    //                         modelId: "product"
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // });
};
