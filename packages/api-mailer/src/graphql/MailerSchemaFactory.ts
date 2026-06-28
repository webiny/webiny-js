import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import { createSettingsGraphQL } from "~/graphql/settings.js";

class MailerSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        const plugin = createSettingsGraphQL() as unknown as IGraphQLSchemaPlugin;
        const schema = plugin.schema;

        if (schema.typeDefs) {
            builder.addTypeDefs(schema.typeDefs);
        }

        if (schema.resolvers) {
            addResolvers(builder, schema.resolvers as Record<string, any>, "");
        }

        return builder;
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
            addResolvers(builder, value, path);
        }
    }
}

export const MailerSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: MailerSchemaFactoryImpl,
    dependencies: []
});
