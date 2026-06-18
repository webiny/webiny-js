import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLSchemaComposer as Abstraction } from "./abstractions.js";
import { GraphQLSchemaFactory, CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "./GraphQLSchemaBuilder.js";
import type { IGraphQLSchemaBuilder } from "./abstractions.js";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";

/**
 * Adds old-style (parent, args, ctx, info) resolvers from a nested object
 * into the DI-aware builder.
 */
function addLegacyResolvers(
    builder: IGraphQLSchemaBuilder,
    resolvers: Record<string, any>,
    prefix: string
): void {
    for (const [key, value] of Object.entries(resolvers)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "function") {
            const fn = value;
            builder.addResolver({
                path,
                dependencies: [],
                resolver:
                    () =>
                    ({ parent, args, context, info }: any) =>
                        fn(parent, args, context, info)
            });
        } else if (typeof value === "object" && value !== null) {
            addLegacyResolvers(builder, value, path);
        }
    }
}

class GraphQLSchemaComposerImpl implements Abstraction.Interface {
    constructor(private container: Container) {}

    async build(ctx?: Record<string, any>): Promise<IGraphQLSchema> {
        const builder = new GraphQLSchemaBuilder();

        // Resolve lazily so factories registered during enhance() (e.g. by extensions) are included.
        const coreSchemas = this.container.resolveAll(CoreGraphQLSchemaFactory);
        const userSchemas = this.container.resolveAll(GraphQLSchemaFactory);

        for (const factory of coreSchemas) {
            await factory.execute(builder, ctx);
        }

        for (const factory of userSchemas) {
            await factory.execute(builder);
        }

        // Include legacy GraphQLSchemaPlugin instances from ctx.plugins.
        // These are registered by old-style features (e.g. FileManagerAppFeature, ACO folder schema)
        // that haven't been migrated to DI-native GraphQLSchemaFactory yet.
        const scalarResolvers: Record<string, any> = {};

        if (ctx?.plugins && typeof ctx.plugins.byType === "function") {
            const legacyPlugins = ctx.plugins.byType("graphql-schema");
            for (const plugin of legacyPlugins) {
                const schema = plugin.schema;
                if (schema?.typeDefs) {
                    builder.addTypeDefs(schema.typeDefs);
                }
                if (schema?.resolvers) {
                    addLegacyResolvers(builder, schema.resolvers as Record<string, any>, "");
                }
            }

            // Include custom scalars registered as graphql-scalar plugins (e.g. RevisionId from CMS).
            const scalarPlugins = ctx.plugins.byType("graphql-scalar");
            for (const plugin of scalarPlugins) {
                const scalar = plugin.scalar;
                builder.addTypeDefs(`scalar ${scalar.name}`);
                scalarResolvers[scalar.name] = scalar;
            }
        }

        const schema = builder.build();
        Object.assign(schema.resolvers as object, scalarResolvers);
        return schema;
    }
}

export const GraphQLSchemaComposer = Abstraction.createImplementation({
    implementation: GraphQLSchemaComposerImpl,
    dependencies: [RequestContainer]
});
