import { GraphQLSchemaBuilder as Abstraction } from "./abstractions.js";
import { GraphQLSchema, GraphQLResolverDecorators } from "~/graphql/abstractions.js";

class GraphQLSchemaBuilderImpl implements Abstraction.Interface {
    constructor(
        private schemas: GraphQLSchema.Interface[],
        private decorators: GraphQLResolverDecorators.Interface[]
    ) {}

    async build(): Promise<Abstraction.SchemaParts> {
        const typeDefsArray: GraphQLSchema.TypeDefs[] = [];
        const resolversArray: GraphQLSchema.Resolvers[] = [];
        const decoratorsArray: GraphQLResolverDecorators.ResolverDecorators[] = [];

        await Promise.all([
            ...this.schemas.map(async schema => {
                typeDefsArray.push(await schema.getTypeDefs());
                resolversArray.push(await schema.getResolvers());
            }),
            // Resolver decorators
            ...this.decorators.map(async decorators => {
                decoratorsArray.push(await decorators.getDecorators());
            })
        ]);

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
        [GraphQLResolverDecorators, { multiple: true }]
    ]
});
