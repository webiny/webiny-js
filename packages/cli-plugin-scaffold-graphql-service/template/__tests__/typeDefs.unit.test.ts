import typeDefs from "../typeDefs";

/**
 * An example of a unit test. You can use these to test a unit in your code, for example
 * a function or a class. Note that, while these tests are fast to run, most often,
 * these do not provide a high level of confidence that our application works.
 * https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api#typedefsunittestts
 */

describe("GraphQL type definitions test", () => {
    test("ensure type definitions include TargetDataModel type", async () => {
        expect(typeDefs.includes("type TargetDataModel")).toBe(true);
    });
});
