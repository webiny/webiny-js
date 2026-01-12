import { GraphQLSchemaBuilder as Abstraction } from "./abstractions.js";
import {
    GraphQLSchemaFactory,
    GraphQLResolverDecoratorsFactory as DecoratorsFactory,
    CoreGraphQLSchemaFactory,
    GraphQLResolversFactory,
    CoreGraphQLTypeDefsFactory,
    CoreGraphQLResolversFactory,
    GraphQLTypeDefsFactory,
    CoreGraphQLResolverDecoratorsFactory as CoreDecoratorsFactory,
    CoreGraphQLResolverDecoratorsFactory,
    GraphQLResolverDecoratorsFactory
} from "~/graphql/abstractions.js";

class GraphQLSchemaBuilderImpl implements Abstraction.Interface {
    private readonly typeDefsArray: GraphQLSchemaFactory.TypeDefs[] = [];
    private readonly resolversArray: GraphQLSchemaFactory.Resolvers[] = [];
    private readonly decoratorsArray: DecoratorsFactory.ResolverDecorators[] = [];

    constructor(
        // Core deps
        private coreSchemas: CoreGraphQLSchemaFactory.Interface[],
        private coreTypeDefs: CoreGraphQLTypeDefsFactory.Interface[],
        private coreResolvers: CoreGraphQLResolversFactory.Interface[],
        private coreDecorators: CoreDecoratorsFactory.Interface[],
        // Public deps
        private userSchemas: GraphQLSchemaFactory.Interface[],
        private userTypeDefs: GraphQLTypeDefsFactory.Interface[],
        private userResolvers: GraphQLResolversFactory.Interface[],
        private userDecorators: DecoratorsFactory.Interface[]
    ) {}

    async build(): Promise<Abstraction.SchemaParts> {
        // Process core abstractions first
        await this.processSchemas(this.coreSchemas);
        await this.processTypeDefs(this.coreTypeDefs);
        await this.processResolvers(this.coreResolvers);
        await this.processDecorators(this.coreDecorators);

        // Process public abstractions last
        await this.processSchemas(this.userSchemas);
        await this.processTypeDefs(this.userTypeDefs);
        await this.processResolvers(this.userResolvers);
        await this.processDecorators(this.userDecorators);

        return {
            typeDefs: this.typeDefsArray.join("\n"),
            resolvers: this.resolversArray,
            resolverDecorators: this.decoratorsArray
        };
    }

    private async processSchemas(factories: GraphQLSchemaFactory.Interface[]) {
        await Promise.all(factories.map(factory => factory.execute())).then(schemas => {
            schemas.flat(1).map(schema => {
                if (schema.typeDefs) {
                    this.typeDefsArray.push(schema.typeDefs);
                }
                if (schema.resolvers) {
                    this.resolversArray.push(schema.resolvers);
                }
                if (schema.resolverDecorators) {
                    this.decoratorsArray.push(schema.resolverDecorators);
                }
            });
        });
    }

    private async processTypeDefs(factories: GraphQLTypeDefsFactory.Interface[]) {
        await Promise.all(factories.map(factory => factory.execute())).then(resolvers => {
            this.typeDefsArray.push(...resolvers.flat());
        });
    }

    private async processResolvers(factories: GraphQLResolversFactory.Interface[]) {
        await Promise.all(factories.map(factory => factory.execute())).then(resolvers => {
            this.resolversArray.push(...resolvers.flat());
        });
    }

    private async processDecorators(factories: DecoratorsFactory.Interface[]) {
        await Promise.all(factories.map(factory => factory.execute())).then(resolvers => {
            this.decoratorsArray.push(...resolvers.flat());
        });
    }
}

export const GraphQLSchemaBuilder = Abstraction.createImplementation({
    implementation: GraphQLSchemaBuilderImpl,
    dependencies: [
        [CoreGraphQLSchemaFactory, { multiple: true }],
        [CoreGraphQLTypeDefsFactory, { multiple: true }],
        [CoreGraphQLResolversFactory, { multiple: true }],
        [CoreGraphQLResolverDecoratorsFactory, { multiple: true }],
        [GraphQLSchemaFactory, { multiple: true }],
        [GraphQLTypeDefsFactory, { multiple: true }],
        [GraphQLResolversFactory, { multiple: true }],
        [GraphQLResolverDecoratorsFactory, { multiple: true }]
    ]
});
