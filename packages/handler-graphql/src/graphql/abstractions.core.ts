/**
 * This file contains abstraction for use by the core Webiny team, or anyone contributing to the webiny-js repository.
 */
import { createAbstraction } from "@webiny/feature/api";
import type {
    Resolvers as IResolvers,
    TypeDefs as ITypeDefs,
    ResolverDecorators as IResolverDecorators
} from "~/types.js";
import {
    IGraphQLResolverDecoratorsFactory,
    type IGraphQLResolversFactory,
    IGraphQLSchema,
    IGraphQLSchemaFactory,
    type IGraphQLTypeDefsFactory
} from "./abstractions.public.js";

/**
 * CoreGraphQLResolverDecoratorsFactory
 */
export const CoreGraphQLResolverDecoratorsFactory =
    createAbstraction<IGraphQLResolverDecoratorsFactory>("CoreGraphQLResolverDecoratorsFactory");

export namespace CoreGraphQLResolverDecoratorsFactory {
    export type Interface = IGraphQLResolverDecoratorsFactory;
    export type ResolverDecorators = IResolverDecorators;
}

/**
 * CoreGraphQLSchemaFactory
 */
export const CoreGraphQLSchemaFactory = createAbstraction<IGraphQLSchemaFactory>(
    "CoreGraphQLSchemaFactory"
);

export namespace CoreGraphQLSchemaFactory {
    export type Interface<TContext = any> = IGraphQLSchemaFactory<TContext>;
    export type Return<TContext = any> =
        | Promise<IGraphQLSchema<TContext>[]>
        | IGraphQLSchema<TContext>[];
    export type TypeDefs = ITypeDefs;
    export type Resolvers<TContext = any> = IResolvers<TContext>;
}

/**
 * CoreGraphQLTypeDefsFactory
 */
export const CoreGraphQLTypeDefsFactory = createAbstraction<IGraphQLTypeDefsFactory>(
    "CoreGraphQLTypeDefsFactory"
);

export namespace CoreGraphQLTypeDefsFactory {
    export type Interface = IGraphQLTypeDefsFactory;
    export type TypeDefs = ITypeDefs;
}

/**
 * CoreGraphQLResolversFactory
 */
export const CoreGraphQLResolversFactory = createAbstraction<IGraphQLResolversFactory>(
    "CoreGraphQLResolversFactory"
);

export namespace CoreGraphQLResolversFactory {
    export type Interface<TContext = any> = IGraphQLResolversFactory<TContext>;
    export type Resolvers<TContext = any> = IResolvers<TContext>;
}
