import { JwksStore as Abstraction } from "./abstractions.js";

/**
 * Holds one entry per configured identity provider (Cognito, Okta, Auth0...), keyed by the issuer
 * in that provider's configuration, never by anything taken from a request, so it can't grow with
 * traffic. A refresh replaces the issuer's entry instead of adding one.
 */
class MemoryJwksStoreImpl implements Abstraction.Interface {
    private readonly entries = new Map<string, Abstraction.Entry>();

    public get(issuer: string): Abstraction.Entry | undefined {
        return this.entries.get(issuer);
    }

    public set(issuer: string, entry: Abstraction.Entry): void {
        this.entries.set(issuer, entry);
    }
}

export const MemoryJwksStore = Abstraction.createImplementation({
    implementation: MemoryJwksStoreImpl,
    dependencies: []
});
