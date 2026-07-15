import { GraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
export declare class SchedulerGraphQL implements CoreGraphQLSchemaFactory.Interface {
    execute(builder: GraphQLSchemaBuilder.Interface): Promise<GraphQLSchemaBuilder.Interface>;
}
export declare const SchedulerGraphQLFactory: typeof SchedulerGraphQL & {
    __abstraction: import("@webiny/di").Abstraction<import("@webiny/handler-graphql/graphql/abstractions.core.js").ICoreGraphQLSchemaFactory>;
};
