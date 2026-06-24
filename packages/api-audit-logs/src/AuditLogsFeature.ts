import { createFeature, type Container } from "@webiny/feature/api";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/abstractions.js";
import { AuditLogsContext, AuditLogsStorage } from "./abstractions.js";
import type { GraphQLSchema } from "graphql";
import { createAuditLogsContextValue } from "./context/AuditLogsContextValue.js";
import { createSubscriptionHooks } from "./subscriptions/index.js";
import { createGraphQLSchema } from "./graphql/schema.js";

export interface AuditLogsFeatureConfig {
    deleteLogsAfterDays?: number;
}

const getDeleteLogsAfterDays = (days?: number): number => {
    return days && days > 0 ? days : 60;
};

class AuditLogsSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): CoreGraphQLSchemaFactory.Return {
        const plugin = createGraphQLSchema() as any;
        const { typeDefs, resolvers } = plugin.schema ?? {};

        if (typeDefs) {
            const str = Array.isArray(typeDefs) ? typeDefs.join("\n") : String(typeDefs);
            builder.addTypeDefs(str);
        }

        if (resolvers) {
            registerResolvers(builder, resolvers, "");
        }

        return builder;
    }
}

function registerResolvers(
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
                resolver: () => (params: any) =>
                    fn(params.parent, params.args, params.context, params.info)
            });
        } else if (value && typeof value === "object") {
            registerResolvers(builder, value, path);
        }
    }
}

const AuditLogsSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: AuditLogsSchemaFactoryImpl,
    dependencies: []
});

export const AuditLogsFeature = createFeature({
    name: "AuditLogs",
    register(container: Container, config: AuditLogsFeatureConfig = {}) {
        container.register(AuditLogsSchemaFactory);

        let initialized = false;

        const STUB_SCHEMA: GraphQLSchema = makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });

        container.registerInstance(GraphQLContextualSchema, {
            async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
                if (initialized) {
                    return STUB_SCHEMA;
                }
                initialized = true;

                const wcpContext = container.resolve(WcpContext);
                if (!wcpContext.canUseFeature("auditLogs")) {
                    return STUB_SCHEMA;
                }

                const storage = container.resolve(AuditLogsStorage);
                const eventPublisher = container.resolve(EventPublisher);

                ctx.auditLogs = createAuditLogsContextValue({
                    getContext: () => ctx as any,
                    deleteLogsAfterDays: getDeleteLogsAfterDays(config.deleteLogsAfterDays),
                    storage,
                    eventPublisher
                });

                container.registerInstance(AuditLogsContext, ctx.auditLogs);
                createSubscriptionHooks(ctx as any);

                return STUB_SCHEMA;
            }
        });
    }
});
