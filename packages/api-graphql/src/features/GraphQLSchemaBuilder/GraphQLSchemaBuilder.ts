import type { GraphQLSchemaBuilder as Abstraction } from "./abstractions.js";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";
import type { ResolverDecorator, ResolverDecorators, Resolvers } from "~/types.js";
import type { Dependency } from "@webiny/di";

export class GraphQLSchemaBuilder implements Abstraction.Interface {
    private readonly typeDefsArray: string[] = [];
    private readonly resolvers: Resolvers<any> = {};
    private readonly resolverDecorators: ResolverDecorators = {};

    addTypeDefs(typeDefs: string): this {
        this.typeDefsArray.push(typeDefs);
        return this;
    }

    addResolver<TArgs = any>(config: Abstraction.Config<TArgs>): this {
        const { path, dependencies = [], resolver } = config;

        const pathParts = path.split(".");

        const graphqlResolver = (parent: any, args: TArgs, context: any, info: any) => {
            const resolvedDeps = dependencies.map((dep: Dependency) => {
                const [abstraction] = Array.isArray(dep) ? dep : [dep];
                return context.container.resolve(abstraction);
            });

            const actualResolver = resolver(...resolvedDeps);

            return actualResolver({ parent, args, context, info });
        };

        this.setResolverAtPath(pathParts, graphqlResolver);

        return this;
    }

    addLegacyResolvers(resolvers: Record<string, any>, prefix = ""): this {
        for (const [key, value] of Object.entries(resolvers)) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (typeof value === "function") {
                const fn = value;
                this.addResolver({
                    path,
                    dependencies: [],
                    resolver:
                        () =>
                        ({ parent, args, context, info }: any) =>
                            fn(parent, args, context, info)
                });
            } else if (typeof value === "object" && value !== null) {
                this.addLegacyResolvers(value, path);
            }
        }
        return this;
    }

    /**
     * @internal This method needs revisiting, to align with DI concepts.
     */
    addResolverDecorator(path: string, decorator: ResolverDecorator): this {
        if (!this.resolverDecorators[path]) {
            this.resolverDecorators[path] = [];
        }
        this.resolverDecorators[path].push(decorator);
        return this;
    }

    build(): IGraphQLSchema {
        return {
            typeDefs: this.typeDefsArray.join("\n"),
            resolvers: this.resolvers,
            resolverDecorators: this.resolverDecorators
        };
    }

    private setResolverAtPath(pathParts: string[], resolver: any): void {
        let current: any = this.resolvers;

        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        const finalKey = pathParts[pathParts.length - 1];
        current[finalKey] = resolver;
    }
}
