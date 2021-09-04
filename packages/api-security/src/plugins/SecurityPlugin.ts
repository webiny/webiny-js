import { Plugin } from "@webiny/plugins";
import { Security } from "../Security";

interface ApplyFunction<T> {
    (security: T): void;
}

export class SecurityPlugin extends Plugin {
    private readonly _apply: any;
    public static readonly type = "SecurityPlugin";

    constructor(apply: ApplyFunction<Security>) {
        super();
        this._apply = apply;
    }

    apply(security: Security) {
        this._apply(security);
    }
}
