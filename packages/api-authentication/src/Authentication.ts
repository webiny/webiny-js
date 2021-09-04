import { Identity } from "~/Identity";

export class Authentication<TIdentity extends Identity = Identity> {
    protected _identity: TIdentity;

    getIdentity() {
        return this._identity;
    }

    setIdentity(identity: TIdentity) {
        this._identity = identity;
    }
}
