import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types.js";
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
import { createSecurityGraphQL } from "~/graphql/security/index.js";
import { createSystemGraphQL } from "~/graphql/system/createSystemGraphQL.js";
import { createUsersGraphQL } from "~/graphql/users/user.gql.js";
import { createWcpGraphQL } from "~/graphql/wcp/graphql.js";

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

class ApiCoreSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        // Base types + scalars must come before any extend type directives
        builder.addTypeDefs(BASE_TYPES);

        // Scalar implementations
        builder.addLegacyResolvers(SCALAR_RESOLVERS);

        const schemas: GraphQLSchemaDefinition[] = [
            ...createSecurityGraphQL(),
            ...createUsersGraphQL(),
            createSystemGraphQL(),
            createWcpGraphQL()
        ];

        for (const schema of schemas) {
            builder.addTypeDefs(schema.typeDefs as string);

            if (schema.resolvers) {
                builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
            }

            if (schema.resolverDecorators) {
                for (const [path, decorators] of Object.entries(schema.resolverDecorators)) {
                    for (const decorator of decorators) {
                        builder.addResolverDecorator(path, decorator);
                    }
                }
            }
        }

        return builder;
    }
}

export const ApiCoreSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ApiCoreSchemaFactoryImpl,
    dependencies: []
});
