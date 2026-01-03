import { createAbstraction } from "@webiny/feature/api";
import type {
    Resolvers as IResolvers,
    TypeDefs as ITypeDefs,
    ResolverDecorators as IResolverDecorators
} from "~/types.js";

export interface IGraphQLTypeDefs {
    getTypeDefs(): Promise<ITypeDefs> | ITypeDefs;
}

export interface IGraphQLResolvers {
    getResolvers(): Promise<IResolvers<any>> | IResolvers<any>;
}

export interface IGraphQLResolverDecorators {
    getDecorators(): Promise<IResolverDecorators> | IResolverDecorators;
}

export const GraphQLResolverDecorators = createAbstraction<IGraphQLResolverDecorators>(
    "GraphQLResolverDecorators"
);

export namespace GraphQLResolverDecorators {
    export type Interface = IGraphQLResolverDecorators;
    export type ResolverDecorators = IResolverDecorators;
}

export interface IGraphQLSchema extends IGraphQLTypeDefs, IGraphQLResolvers {}

export const GraphQLSchema = createAbstraction<IGraphQLSchema>("GraphQLSchema");
export namespace GraphQLSchema {
    export type Interface = IGraphQLSchema;
    export type TypeDefs = ITypeDefs;
    export type Resolvers = IResolvers<any>;
    export type GetTypeDefsReturn = Promise<ITypeDefs> | ITypeDefs;
    export type GetResolversReturn = Promise<IResolvers<any>> | IResolvers<any>;
}
