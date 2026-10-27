import type { Container } from "@webiny/di";
import { buildSchema } from "graphql";
import type { GraphQLSchema } from "graphql";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/GraphQLSchemaBuilder.js";
import {
    CoreGraphQLSchemaFactory,
    GraphQLSchemaFactory
} from "@webiny/api-graphql/graphql/abstractions.js";

/**
 * What the other packages put in the one `/graphql` type document and the factories of this
 * package refer to: the scalars and the roots they extend.
 */
const STUBS = /* GraphQL */ `
    scalar JSON
    scalar DateTime
    scalar Date
    type Query {
        _stub: String
    }
    type Mutation {
        _stub: String
    }
    type CmsQuery {
        _stub: String
    }
`;

export interface ComposedSchema {
    /** Every type definition the registered factories added, without the stubs. */
    typeDefs: string;
    /** The resolver tree the factories built, `{ <Type>: { <field>: resolver } }`. */
    resolvers: Record<string, Record<string, (...args: unknown[]) => unknown>>;
    /** The type document and the stubs parsed into a schema; throws when the document is not valid. */
    schema: GraphQLSchema;
}

/**
 * Runs every registered `CoreGraphQLSchemaFactory` and `GraphQLSchemaFactory`, in the order the
 * real composer does (core first), into one builder. `extra` is added after the factories, e.g.
 * the minimal `WorkflowsQuery` a test needs when it does not register `WorkflowsSchemaFactory`.
 */
export const composeSchema = async (container: Container, extra = ""): Promise<ComposedSchema> => {
    const builder = new GraphQLSchemaBuilder();
    for (const factory of container.resolveAll(CoreGraphQLSchemaFactory)) {
        await factory.execute(builder);
    }
    for (const factory of container.resolveAll(GraphQLSchemaFactory)) {
        await factory.execute(builder);
    }
    const built = builder.build();
    const typeDefs = String(built.typeDefs);
    return {
        typeDefs,
        resolvers: built.resolvers as unknown as ComposedSchema["resolvers"],
        schema: buildSchema(`${STUBS}\n${extra}\n${typeDefs}`)
    };
};
