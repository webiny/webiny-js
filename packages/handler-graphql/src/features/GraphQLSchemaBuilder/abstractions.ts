import { createAbstraction } from "@webiny/feature/api";
import type { ResolverDecorator, TypeDefs } from "~/types.js";
import type { Dependency } from "@webiny/di";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";

export interface ResolverConfig<TArgs = any, TParent = any> {
    path: string;
    dependencies?: Dependency[];
    resolver: (
        ...resolvedDeps: any[]
    ) => (params: { parent: TParent; args: TArgs; context: any; info: any }) => any;
}

export interface IGraphQLSchemaBuilder {
    addTypeDefs(typeDefs: TypeDefs): this;
    addResolver<TArgs = any, TParent = any>(config: ResolverConfig<TArgs, TParent>): this;
    /**
     * @internal This method needs revisiting, to align with DI concepts.
     */
    addResolverDecorator(path: string, decorator: ResolverDecorator): this;
    build(): IGraphQLSchema;
}

export const GraphQLSchemaBuilder =
    createAbstraction<IGraphQLSchemaBuilder>("GraphQLSchemaBuilder");

export namespace GraphQLSchemaBuilder {
    export type Interface = IGraphQLSchemaBuilder;
    export type Config<TArgs = any> = ResolverConfig<TArgs>;
}

export interface IGraphQLSchemaComposer {
    build(): Promise<IGraphQLSchema>;
}

export const GraphQLSchemaComposer =
    createAbstraction<IGraphQLSchemaComposer>("GraphQLSchemaComposer");

export namespace GraphQLSchemaComposer {
    export type Interface = IGraphQLSchemaComposer;
}
