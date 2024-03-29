import { Plugin } from "@webiny/plugins";
import { GraphQLSchemaDefinition, Resolvers, Types } from "~/types";
import { Context } from "@webiny/api/types";

export interface IGraphQLSchemaPlugin<TContext = Context> extends Plugin {
    schema: GraphQLSchemaDefinition<TContext>;
}

export interface GraphQLSchemaPluginConfig<TContext> {
    typeDefs?: Types;
    resolvers?: Resolvers<TContext>;
}

export class GraphQLSchemaPlugin<TContext = Context>
    extends Plugin
    implements IGraphQLSchemaPlugin<TContext>
{
    public static override readonly type: string = "graphql-schema";
    protected config: GraphQLSchemaPluginConfig<TContext>;

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

export const createGraphQLSchemaPlugin = <TContext = Context>(
    params: GraphQLSchemaPluginConfig<TContext>
) => {
    return new GraphQLSchemaPlugin<TContext>(params);
};
