import { describe, test, expect } from "vitest";
import type { Container } from "@webiny/di";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { useGqlHandler } from "~tests/useGqlHandler.js";

class DateTimeZSchema implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("test/DateTimeZSchema");

    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
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

const registerDateTimeZSchema = (container: Container) => {
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
        const { invoke } = useGqlHandler({ registrations: [registerDateTimeZSchema] });

        const [response] = await invoke({ body: { query: `{ scheduledAt }` } });

        expect(response.errors).toBeFalsy();
        expect(response.data.scheduledAt).toBe("2026-12-24T09:00:00+01:00");
    });
});
