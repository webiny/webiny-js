import { Plugin } from "@webiny/plugins";
import { TenancyContext, Tenant as BaseTenant } from "../types";

type PromiseVoid = void | Promise<void>;

export interface CreateParams<Tenant, Context> {
    context: Context;
    tenant: Tenant;
}

export interface BeforeUpdateParams<Tenant, Context> {
    context: Context;
    tenant: Tenant;
    inputData: Record<string, any>;
    updateData: Partial<Tenant>;
}

export interface AfterUpdateParams<Tenant, Context> {
    context: Context;
    tenant: Tenant;
    inputData: Record<string, any>;
}

export interface DeleteParams<Tenant, Context> {
    context: Context;
    tenant: Tenant;
}

interface Config<
    Tenant extends BaseTenant = BaseTenant,
    Context extends TenancyContext = TenancyContext
> {
    beforeCreate?: (params: CreateParams<Tenant, Context>) => PromiseVoid;
    afterCreate?: (params: CreateParams<Tenant, Context>) => PromiseVoid;
    beforeUpdate?: (params: BeforeUpdateParams<Tenant, Context>) => PromiseVoid;
    afterUpdate?: (params: AfterUpdateParams<Tenant, Context>) => PromiseVoid;
    beforeDelete?: (params: DeleteParams<Tenant, Context>) => PromiseVoid;
    afterDelete?: (params: DeleteParams<Tenant, Context>) => PromiseVoid;
}

export class TenantPlugin<
    Tenant extends BaseTenant = BaseTenant,
    Context extends TenancyContext = TenancyContext
> extends Plugin {
    public static readonly type = "tenancy.tenant";
    private readonly _config: Config<Tenant, Context>;

    constructor(config?: Config<Tenant, Context>) {
        super();
        this._config = config || {};
    }

    beforeCreate(params: CreateParams<Tenant, Context>): PromiseVoid {
        return this._execute("beforeCreate", params);
    }

    afterCreate(params: CreateParams<Tenant, Context>): PromiseVoid {
        return this._execute("afterCreate", params);
    }

    afterDelete(params: DeleteParams<Tenant, Context>): PromiseVoid {
        return this._execute("afterDelete", params);
    }

    afterUpdate(params: AfterUpdateParams<Tenant, Context>): PromiseVoid {
        return this._execute("afterUpdate", params);
    }

    beforeDelete(params: DeleteParams<Tenant, Context>): PromiseVoid {
        return this._execute("beforeDelete", params);
    }

    beforeUpdate(params: BeforeUpdateParams<Tenant, Context>): PromiseVoid {
        return this._execute("beforeUpdate", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}
