import { createAbstraction } from "@webiny/feature/api";
import type {
    Resolvers as IResolvers,
    TypeDefs,
    ResolverDecorators as IResolverDecorators
} from "~/types.js";

export interface IGraphQLSchema {
    getTypeDefs(): Promise<TypeDefs> | TypeDefs;
}

export const GraphQLSchema = createAbstraction<IGraphQLSchema>("GraphQLSchema");

export namespace GraphQLSchema {
    export type Interface = IGraphQLSchema;
}

export interface IGraphQLResolvers {
    getResolvers(): Promise<IResolvers<any>> | IResolvers<any>;
}

export const GraphQLResolvers = createAbstraction<IGraphQLResolvers>("GraphQLResolvers");

export namespace GraphQLResolvers {
    export type Interface = IGraphQLResolvers;
    export type Resolvers = IResolvers<any>;
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
