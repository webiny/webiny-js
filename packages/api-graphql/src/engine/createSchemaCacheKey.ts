import { createHash } from "node:crypto";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";

const collectResolverPaths = (resolvers: Record<string, any>, prefix: string, paths: string[]) => {
    for (const [key, value] of Object.entries(resolvers)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "function") {
            paths.push(path);
        } else if (value && typeof value === "object") {
            collectResolverPaths(value, path, paths);
        }
    }
};

/**
 * The key identifies what an executable schema is built from: the type definitions, which paths
 * have a resolver, and how many decorators each path has. Resolver functions themselves can't be
 * compared, but every one of them resolves its dependencies when it runs, so two requests that
 * produce the same key produce schemas that behave the same.
 */
export const createSchemaCacheKey = (schema: IGraphQLSchema): string => {
    const resolverPaths: string[] = [];
    collectResolverPaths(schema.resolvers ?? {}, "", resolverPaths);

    const decoratorPaths = Object.entries(schema.resolverDecorators ?? {}).map(
        ([path, decorators]) => `${path}:${decorators.length}`
    );

    const hash = createHash("sha1");
    hash.update(String(schema.typeDefs ?? ""));
    hash.update("\n#resolvers\n");
    hash.update(resolverPaths.sort().join("\n"));
    hash.update("\n#decorators\n");
    hash.update(decoratorPaths.sort().join("\n"));

    return hash.digest("hex");
};
