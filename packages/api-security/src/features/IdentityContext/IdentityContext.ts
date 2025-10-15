import { type AuthenticationToken, IdentityContext as ContextAbstraction } from "./abstractions";
import type { Security } from "~/types.js";
import type { Identity } from "@webiny/api-authentication/types";

export class IdentityContext implements ContextAbstraction.Interface {
    private context: Security;

    constructor(context: Security) {
        this.context = context;
    }

    getIdentity<TIdentity extends Identity = Identity>(): TIdentity | undefined {
        return this.context.getIdentity<TIdentity>();
    }

    getToken(): AuthenticationToken | undefined {
        return this.context.getToken();
    }

    setIdentity(identity: Identity): void {
        this.context.setIdentity(identity);
    }

    withIdentity<T>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T> {
        return this.context.withIdentity<T>(identity, cb);
    }
}
