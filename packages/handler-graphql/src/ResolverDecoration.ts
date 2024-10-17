import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { ResolverDecorators, Resolvers } from "./types";

export class ResolverDecoration {
    private decorators: ResolverDecorators = {};

    addDecorators(resolverDecorators: ResolverDecorators) {
        for (const key in resolverDecorators) {
            const decorators = resolverDecorators[key];
            if (!decorators) {
                continue;
            }

            const existingDecorators = this.decorators[key] ?? [];
            this.decorators[key] = [...existingDecorators, ...decorators];
        }
    }

    decorateResolvers(resolvers: Resolvers<unknown>) {
        return composeResolvers(resolvers, this.decorators);
    }
}
