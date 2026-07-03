import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import {
    JsonScalar,
    LongScalar,
    IconScalar,
    RefInputScalar,
    NumberScalar,
    AnyScalar,
    DateTimeScalar,
    DateScalar,
    TimeScalar
} from "@webiny/handler-graphql/builtInTypes/index.js";

const BASE_TYPES = `
    type Query
    type Mutation
    scalar JSON
    scalar Long
    scalar Icon
    scalar RefInput
    scalar Number
    scalar Any
    scalar Date
    scalar DateTime
    scalar Time

    type Error {
        code: String
        message: String
        data: JSON
        stack: String
    }

    type BooleanResponse {
        data: Boolean
        error: Error
    }
`;

const SCALAR_RESOLVERS: Record<string, any> = {
    JSON: JsonScalar,
    Long: LongScalar,
    Icon: IconScalar,
    RefInput: RefInputScalar,
    Number: NumberScalar,
    Any: AnyScalar,
    DateTime: DateTimeScalar,
    Date: DateScalar,
    Time: TimeScalar
};

/**
 * The base of the core API schema: the root Query/Mutation, shared scalars and their
 * implementations, and the shared Error/BooleanResponse types. The actual domains (security,
 * users, system, wcp) are their own CoreGraphQLSchemaFactory implementations — order between
 * core factories does not matter, the engine merges all typeDefs in a single pass.
 */
class ApiCoreSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(BASE_TYPES);

        // Scalar implementations (scalar type objects, not container-resolving resolvers).
        builder.addLegacyResolvers(SCALAR_RESOLVERS);

        return builder;
    }
}

export const ApiCoreSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ApiCoreSchemaFactoryImpl,
    dependencies: []
});
