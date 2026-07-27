import { createFeature, type Container } from "@webiny/feature/api";
import { GraphQLContextualSchema } from "@webiny/api-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/abstractions.js";
import { AuditLogsContext, AuditLogsStorage } from "./abstractions.js";
import type { GraphQLSchema } from "graphql";
import { createAuditLogsContextValue } from "./context/AuditLogsContextValue.js";
import { createSubscriptionHooks } from "./subscriptions/index.js";
import { AuditLogsGraphQLSchema } from "./graphql/AuditLogsGraphQLSchema.js";

export interface AuditLogsFeatureConfig {
    deleteLogsAfterDays?: number;
}

const getDeleteLogsAfterDays = (days?: number): number => {
    return days && days > 0 ? days : 60;
};

export const AuditLogsFeature = createFeature({
    name: "AuditLogs",
    register(container: Container, config: AuditLogsFeatureConfig = {}) {
        container.register(AuditLogsGraphQLSchema);

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
