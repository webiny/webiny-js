import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
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

function addPluginsToBuilder(
    plugins: IGraphQLSchemaPlugin[],
    builder: IGraphQLSchemaBuilder
): void {
    for (const plugin of plugins) {
        const schema = plugin.schema;

        if (schema.typeDefs) {
            builder.addTypeDefs(schema.typeDefs);
        }

        if (schema.resolvers) {
            addResolvers(builder, schema.resolvers as Record<string, any>, "");
        }

        if (schema.resolverDecorators) {
            for (const [path, decorators] of Object.entries(schema.resolverDecorators)) {
                for (const decorator of decorators as any[]) {
                    builder.addResolverDecorator(path, decorator);
                }
            }
        }
    }
}

function addResolvers(
    builder: IGraphQLSchemaBuilder,
    resolvers: Record<string, any>,
    prefix: string
): void {
    for (const [key, value] of Object.entries(resolvers)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "function") {
            const oldResolver = value;
            builder.addResolver({
                path,
                dependencies: [],
                resolver:
                    () =>
                    ({ parent, args, context, info }: any) =>
                        oldResolver(parent, args, context, info)
            });
        } else if (typeof value === "object" && value !== null) {
            addResolvers(builder, value, path);
        }
    }
}

class ApiCoreSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        // Base types + scalars must come before any extend type directives
        builder.addTypeDefs(BASE_TYPES);

        // Scalar implementations
        addResolvers(builder, SCALAR_RESOLVERS, "");

        const plugins = [
            ...createSecurityGraphQL(),
            ...createUsersGraphQL(),
            createSystemGraphQL()
        ] as unknown as IGraphQLSchemaPlugin[];

        addPluginsToBuilder(plugins, builder);

        return builder;
    }
}

export const ApiCoreSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ApiCoreSchemaFactoryImpl,
    dependencies: []
});
