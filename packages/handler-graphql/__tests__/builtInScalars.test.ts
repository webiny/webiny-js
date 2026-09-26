import { describe, test, expect } from "vitest";
import useGqlHandler from "./useGqlHandler";
import { booksSchemaPlugin } from "~tests/mocks/booksSchema";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions";
import { createContextPlugin } from "@webiny/handler";
import type { Context } from "./types";

class DateTimeZSchema implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                scheduledAt: DateTimeZ
            }
        `);

        builder.addResolver({
            path: "Query.scheduledAt",
            dependencies: [],
            resolver: () => {
                return async () => "2026-12-24T09:00:00+01:00";
            }
        });

        return builder;
    }
}

const dateTimeZSchemaPlugin = createContextPlugin<Context>(context => {
    context.container.register(
        CoreGraphQLSchemaFactory.createImplementation({
            implementation: DateTimeZSchema,
            dependencies: []
        })
    );
});

describe("Built-in scalars", () => {
    // Content models render their fields (including `DateTimeZ` datetimes) into this schema.
    test("DateTimeZ is available to schema plugins", async () => {
        const { invoke } = useGqlHandler({
            plugins: [booksSchemaPlugin, dateTimeZSchemaPlugin]
        });

        const [response] = await invoke({ body: { query: `{ scheduledAt }` } });

        expect(response.errors).toBeFalsy();
        expect(response.data.scheduledAt).toBe("2026-12-24T09:00:00+01:00");
    });
});
