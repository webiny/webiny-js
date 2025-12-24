import { GraphQLSchemaBuilder as Abstraction } from "./abstractions.js";
import {
    GraphQLSchema,
    GraphQLResolvers,
    GraphQLResolverDecorators
} from "~/graphql/abstractions.js";
import type { TypeDefs } from "~/types.js";

class GraphQLSchemaBuilderImpl implements Abstraction.Interface {
    constructor(
        private schemas: GraphQLSchema.Interface[],
        private resolvers: GraphQLResolvers.Interface[],
        private decorators: GraphQLResolverDecorators.Interface[]
    ) {}

    async build(): Promise<Abstraction.SchemaParts> {
        const typeDefsArray: TypeDefs[] = [];
        const resolversArray: GraphQLResolvers.Resolvers[] = [];
        const decoratorsArray: GraphQLResolverDecorators.ResolverDecorators[] = [];

        for (const schema of this.schemas) {
            const typeDefs = await schema.getTypeDefs();
            typeDefsArray.push(typeDefs);
        }

        for (const resolver of this.resolvers) {
            const resolverMap = await resolver.getResolvers();
            resolversArray.push(resolverMap);
        }

        for (const decorator of this.decorators) {
            const decoratorMap = await decorator.getDecorators();
            decoratorsArray.push(decoratorMap);
        }

        return {
            typeDefs: typeDefsArray.join("\n"),
            resolvers: resolversArray,
            resolverDecorators: decoratorsArray
        };
    }
}

export const GraphQLSchemaBuilder = Abstraction.createImplementation({
    implementation: GraphQLSchemaBuilderImpl,
    dependencies: [
        [GraphQLSchema, { multiple: true }],
        [GraphQLResolvers, { multiple: true }],
        [GraphQLResolverDecorators, { multiple: true }]
    ]
});
