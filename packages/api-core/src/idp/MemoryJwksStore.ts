import { JwksStore as Abstraction } from "./abstractions.js";

/**
 * Holds one entry per configured identity provider (Cognito, Okta, Auth0...), keyed by the issuer
 * in that provider's configuration, never by anything taken from a request, so it can't grow with
 * traffic. A refresh updates the issuer's entry instead of adding one.
 */
class MemoryJwksStoreImpl implements Abstraction.Interface {
    private readonly states = new Map<string, Abstraction.IssuerState>();

    public get(issuer: string): Abstraction.IssuerState {
        let state = this.states.get(issuer);
        if (!state) {
            state = {};
            this.states.set(issuer, state);
        }
        return state;
    }
}

export const MemoryJwksStore = Abstraction.createImplementation({
    implementation: MemoryJwksStoreImpl,
    dependencies: []
});
