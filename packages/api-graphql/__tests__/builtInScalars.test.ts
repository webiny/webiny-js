import { describe, test, expect } from "vitest";
import type { Container } from "@webiny/di";
import useGqlHandler from "./useGqlHandler";
import { booksSchemaPlugin } from "~tests/mocks/booksSchema";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions";

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

const dateTimeZSchemaPlugin = (container: Container) => {
    container.register(
        CoreGraphQLSchemaFactory.createImplementation({
            implementation: DateTimeZSchema,
            dependencies: []
        })
    );
};

describe("Built-in scalars", () => {
    // Content models render their fields (including `DateTimeZ` datetimes) into this schema.
    test("DateTimeZ is available to schema factories", async () => {
        const { invoke } = useGqlHandler({
            setup: [booksSchemaPlugin, dateTimeZSchemaPlugin]
        });

        const [response] = await invoke({ body: { query: `{ scheduledAt }` } });

        expect(response.errors).toBeFalsy();
        expect(response.data.scheduledAt).toBe("2026-12-24T09:00:00+01:00");
    });
});
