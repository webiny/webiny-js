import { Plugin } from "@webiny/plugins";
import { TenancyContext, Tenant } from "../types";

type PromiseVoid = void | Promise<void>;

export interface UpdateInput {
    // TODO: add fields from GraphQL
    [key: string]: any;
}

export interface CreateParams<TTenant, TContext> {
    context: TContext;
    tenant: TTenant;
}

export interface BeforeUpdateParams<TTenant, TContext> {
    context: TContext;
    tenant: TTenant;
    inputData: Record<string, any>;
    updateData: Partial<TTenant>;
}

export interface AfterUpdateParams<TTenant, TContext> {
    context: TContext;
    tenant: TTenant;
    inputData: Record<string, any>;
}

export interface DeleteParams<TTenant, TContext> {
    context: TContext;
    tenant: TTenant;
}

interface ITenantPlugin<
    TTenant extends Tenant = Tenant,
    TContext extends TenancyContext = TenancyContext
> {
    beforeCreate(params: CreateParams<TTenant, TContext>): PromiseVoid;
    afterCreate(params: CreateParams<TTenant, TContext>): PromiseVoid;
    beforeUpdate(params: BeforeUpdateParams<TTenant, TContext>): PromiseVoid;
    afterUpdate(params: AfterUpdateParams<TTenant, TContext>): PromiseVoid;
    beforeDelete(params: DeleteParams<TTenant, TContext>): PromiseVoid;
    afterDelete(params: DeleteParams<TTenant, TContext>): PromiseVoid;
}

type Config<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TTenant extends Tenant = Tenant,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TContext extends TenancyContext = TenancyContext
> = Partial<ITenantPlugin>;

export class TenantPlugin<
    TTenant extends Tenant = Tenant,
    TContext extends TenancyContext = TenancyContext
> extends Plugin implements ITenantPlugin {
    public static readonly type = "tenancy.tenant";
    private readonly _config: Partial<Config>;

    constructor(config?: Config<TTenant, TContext>) {
        super();
        this._config = config || {};
    }

    beforeCreate(params: CreateParams<TTenant, TContext>): void | Promise<void> {
        return this._execute("beforeCreate", params);
    }

    afterCreate(params: CreateParams<TTenant, TContext>): void | Promise<void> {
        return this._execute("afterCreate", params);
    }

    afterDelete(params: DeleteParams<Tenant, TenancyContext>): void | Promise<void> {
        return this._execute("afterDelete", params);
    }

    afterUpdate(params: AfterUpdateParams<Tenant, TenancyContext>): void | Promise<void> {
        return this._execute("afterUpdate", params);
    }

    beforeDelete(params: DeleteParams<Tenant, TenancyContext>): void | Promise<void> {
        return this._execute("beforeDelete", params);
    }

    beforeUpdate(params: BeforeUpdateParams<Tenant, TenancyContext>): void | Promise<void> {
        return this._execute("beforeUpdate", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}
