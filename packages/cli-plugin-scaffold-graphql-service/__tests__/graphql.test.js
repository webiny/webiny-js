import { graphql } from "graphql";
import plugins from "../template/src/plugins";
import { createUtils } from "./utils";

// TODO: update tests with new schema

describe.skip("Scaffold GraphQL service test", () => {
    const { useSchema } = createUtils([plugins()]);
    let unicorns;

    test("Get all unicorns", async () => {
        const query = /* GraphQL */ `
            query {
                getUnicorns {
                    id
                    name
                    weight
                }
            }
        `;
        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context);

        if (response.errors) {
            throw response.errors;
        }
        expect(response.data.getUnicorns.length).toBeGreaterThanOrEqual(1);
        unicorns = response.data.getUnicorns;
    });

    test("Get unicorn by name", async () => {
        const query = /* GraphQL */ `
            query getThatUnicorn($name: String!) {
                getUnicorn(name: $name) {
                    id
                    name
                    weight
                }
            }
        `;
        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context, {
            name: unicorns[0].name
        });

        if (response.errors) {
            throw response.errors;
        }
        expect(response.data.getUnicorn).toEqual(unicorns[0]);
    });
});
