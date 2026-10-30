import { GraphQLSchemaKeyVerification as Abstraction } from "./abstractions.js";

/**
 * Remembers the output each factory produced under each schema key, and throws when the same factory
 * produces something else under a key it used before.
 */
class MemoryGraphQLSchemaKeyVerificationImpl implements Abstraction.Interface {
    private readonly outputs = new Map<string, string>();

    public check(params: Abstraction.Check): void {
        const { factory, key, output } = params;
        const id = JSON.stringify([factory, key]);
        const previous = this.outputs.get(id);

        if (previous === undefined) {
            this.outputs.set(id, output);
            return;
        }

        if (previous !== output) {
            throw new Error(
                `GraphQL schema factory "${factory}" produced a different schema under the same schema key "${key}". Its getSchemaKey() is missing something its output depends on.`
            );
        }
    }
}

export const MemoryGraphQLSchemaKeyVerification = Abstraction.createImplementation({
    implementation: MemoryGraphQLSchemaKeyVerificationImpl,
    dependencies: []
});
