import { Plugin } from "@webiny/plugins";
import { Tenancy } from "~/Tenancy";

interface ApplyFunction<T> {
    (security: T): void;
}

export class TenancyPlugin extends Plugin {
    private readonly _apply: any;
    public static readonly type = "TenancyPlugin";

    constructor(apply: ApplyFunction<Tenancy>) {
        super();
        this._apply = apply;
    }

    apply(security: Tenancy) {
        this._apply(security);
    }
}
