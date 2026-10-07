import { createHash } from "node:crypto";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLSchemaComposer as Abstraction } from "./abstractions.js";
import { GraphQLSchemaFactory, CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import { GraphQLSchemaKeyVerification } from "~/engine/abstractions.js";
import { createSchemaCacheKey } from "~/engine/createSchemaCacheKey.js";
import { GraphQLSchemaBuilder } from "./GraphQLSchemaBuilder.js";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";

type SchemaFactory = CoreGraphQLSchemaFactory.Interface | GraphQLSchemaFactory.Interface;

type KeyedSchemaFactory = SchemaFactory & {
    getSchemaKey(): string | Promise<string>;
};

function isKeyed(factory: SchemaFactory): factory is KeyedSchemaFactory {
    return typeof factory.getSchemaKey === "function";
}

// The output of one factory on its own, reduced to the same key the engine uses for a full schema.
async function getFactoryOutput(factory: SchemaFactory): Promise<string> {
    const builder = new GraphQLSchemaBuilder();
    await factory.execute(builder);
    const schema = builder.build();
    return createSchemaCacheKey(schema);
}

// Runs each factory on its own and checks its output against its schema key.
async function verifyKeys(
    verification: GraphQLSchemaKeyVerification.Interface,
    factories: SchemaFactory[],
    keys: string[]
): Promise<void> {
    for (let i = 0; i < factories.length; i++) {
        const output = await getFactoryOutput(factories[i]);
        verification.check({
            factory: factories[i].constructor.name,
            key: keys[i],
            output
        });
    }
}

class GraphQLSchemaComposerImpl implements Abstraction.Interface {
    constructor(
        private container: Container,
        private verification: GraphQLSchemaKeyVerification.Interface | undefined
    ) {}

    async build(): Promise<IGraphQLSchema> {
        const builder = new GraphQLSchemaBuilder();

        for (const factory of this.getFactories()) {
            await factory.execute(builder);
        }

        return builder.build();
    }

    async getSchemaKey(): Promise<string | null> {
        const factories = this.getFactories();
        if (!factories.every(isKeyed)) {
            return null;
        }

        const pendingKeys = factories.map(factory => factory.getSchemaKey());
        const keys = await Promise.all(pendingKeys);

        if (this.verification) {
            await verifyKeys(this.verification, factories, keys);
        }

        const hash = createHash("sha1");
        hash.update(keys.join("\n"));
        return hash.digest("hex");
    }

    private getFactories(): SchemaFactory[] {
        const coreSchemas = this.container.resolveAll(CoreGraphQLSchemaFactory);
        const userSchemas = this.container.resolveAll(GraphQLSchemaFactory);
        return [...coreSchemas, ...userSchemas];
    }
}

export const GraphQLSchemaComposer = Abstraction.createImplementation({
    implementation: GraphQLSchemaComposerImpl,
    dependencies: [RequestContainer, [GraphQLSchemaKeyVerification, { optional: true }]]
});
