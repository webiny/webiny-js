import { Plugin } from "@webiny/plugins";
import { GraphQLSchemaDefinition, Resolvers, Types } from "~/types";
import { Context } from "@webiny/handler/types";

export interface GraphQLSchemaPluginConfig<TContext> {
    typeDefs?: Types;
    resolvers?: Resolvers<TContext>;
}

export class GraphQLSchemaPlugin<TContext = Context> extends Plugin {
    public static readonly type = "graphql-schema";
    private config: GraphQLSchemaPluginConfig<TContext>;

    constructor(config: GraphQLSchemaPluginConfig<TContext>) {
        super();
        this.config = config;
    }

    get schema(): GraphQLSchemaDefinition<TContext> {
        return {
            typeDefs: this.config.typeDefs || "",
            resolvers: this.config.resolvers
        };
    }
}
