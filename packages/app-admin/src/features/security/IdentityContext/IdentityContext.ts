import { makeAutoObservable } from "mobx";
import { Identity } from "~/domain/Identity.js";
import { IdentityContext as Abstraction } from "./abstractions.js";

class IdentityContextImpl implements Abstraction.Interface {
    private identity: Identity = Identity.createAnonymous();

    constructor() {
        makeAutoObservable(this);
    }

    getIdentity(): Identity {
        return this.identity;
    }

    setIdentity(identity: Identity | undefined): void {
        if (!identity) {
            this.identity = Identity.createAnonymous();
            return;
        }

        this.identity = identity;
    }
}

export const IdentityContext = Abstraction.createImplementation({
    implementation: IdentityContextImpl,
    dependencies: []
});
