import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/api";
import { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/GraphQLSchemaBuilder.js";

interface IGreeter {
    greet(): string;
}

const Greeter = createAbstraction<IGreeter>("TestGreeter");

class Hello implements IGreeter {
    greet() {
        return "hello";
    }
}

class Goodbye implements IGreeter {
    greet() {
        return "goodbye";
    }
}

/**
 * `addResolver` resolves its dependencies off the request container at call time, so the resolver
 * has to be invoked through the built resolver map to see what it actually received.
 */
function callResolver(builder: GraphQLSchemaBuilder.Interface, path: string, container: Container) {
    const schema = builder.build();
    const [type, field] = path.split(".");
    const resolver = (schema.resolvers as Record<string, Record<string, any>>)[type][field];

    return resolver({}, {}, { container }, {});
}

describe("GraphQLSchemaBuilder resolver dependencies", () => {
    it("single-resolves a bare abstraction", async () => {
        const container = new Container();
        container.register(
            Greeter.createImplementation({ implementation: Hello, dependencies: [] })
        );

        const builder = new GraphQLSchemaBuilder();
        builder.addTypeDefs(/* GraphQL */ `
            type Query {
                greeting: String
            }
        `);
        builder.addResolver({
            path: "Query.greeting",
            dependencies: [Greeter],
            resolver: (greeter: IGreeter) => () => greeter.greet()
        });

        expect(await callResolver(builder, "Query.greeting", container)).toBe("hello");
    });

    /*
     * The regression this file exists for. `addResolver` accepted the `[abstraction, options]`
     * dependency tuple, destructured it, dropped the options and single-resolved anyway, so a
     * resolver asking for every implementation got one object and died on `.map`. It surfaced as
     * "e.map is not a function" from the resolver, with nothing pointing at the builder.
     */
    it("resolves every implementation when a dependency asks for multiple", async () => {
        const container = new Container();
        container.register(
            Greeter.createImplementation({ implementation: Hello, dependencies: [] })
        );
        container.register(
            Greeter.createImplementation({ implementation: Goodbye, dependencies: [] })
        );

        const builder = new GraphQLSchemaBuilder();
        builder.addTypeDefs(/* GraphQL */ `
            type Query {
                greetings: [String]
            }
        `);
        builder.addResolver({
            path: "Query.greetings",
            dependencies: [[Greeter, { multiple: true }]],
            resolver: (greeters: IGreeter[]) => () => greeters.map(g => g.greet())
        });

        const result = await callResolver(builder, "Query.greetings", container);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual(expect.arrayContaining(["hello", "goodbye"]));
    });

    it("returns an array, not undefined, when nothing is registered for a multiple dependency", async () => {
        const builder = new GraphQLSchemaBuilder();
        builder.addTypeDefs(/* GraphQL */ `
            type Query {
                greetings: [String]
            }
        `);
        builder.addResolver({
            path: "Query.greetings",
            dependencies: [[Greeter, { multiple: true }]],
            resolver: (greeters: IGreeter[]) => () => greeters.map(g => g.greet())
        });

        expect(await callResolver(builder, "Query.greetings", new Container())).toEqual([]);
    });
});
