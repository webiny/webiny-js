import { Context } from "@webiny/api/types";
import { Plugin } from "@webiny/plugins";
import { GraphQLSchemaDefinition, ResolverDecorators, Resolvers, TypeDefs } from "~/types";

export interface IGraphQLSchemaPlugin<TContext = Context> extends Plugin {
    schema: GraphQLSchemaDefinition<TContext>;
    isApplicable: (context: TContext) => boolean;
}

export interface GraphQLSchemaPluginConfig<TContext> {
    typeDefs?: TypeDefs;
    resolvers?: Resolvers<TContext>;
    resolverDecorators?: ResolverDecorators;
    isApplicable?: (context: TContext) => boolean;
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
            resolvers: this.config.resolvers,
            resolverDecorators: this.config.resolverDecorators
        };
    }

    isApplicable(context: TContext): boolean {
        if (this.config.isApplicable) {
            return this.config.isApplicable(context);
        }
        return true;
    }
}

export const createGraphQLSchemaPlugin = <T = Context>(config: GraphQLSchemaPluginConfig<T>) => {
    return new GraphQLSchemaPlugin<T>(config);
};
