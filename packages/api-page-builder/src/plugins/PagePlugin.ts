import { Plugin } from "@webiny/plugins";
import { Page, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

export interface UpdateInput {
    // TODO: add fields from GraphQL
    [key: string]: any;
}

export interface CreateParams {
    context: PbContext;
    page: Page;
}

export interface BeforeUpdateParams {
    context: PbContext;
    existingPage: Page;
    inputData: UpdateInput;
    updateData: Partial<Page>;
}

export interface AfterUpdateParams {
    context: PbContext;
    page: Page;
    inputData: UpdateInput;
}

export interface DeleteParams {
    context: PbContext;
    page: Page;
    // TODO: @doitadrian - we need to get rid of these two parameters below as they're very DDB specific
    latestPage: Page;
    publishedPage?: Page;
}

export interface PublishParams {
    context: PbContext;
    page: Page;
    // TODO: @doitadrian - we need to get rid of these two parameters below as they're very DDB specific
    latestPage: Page;
    publishedPage?: Page;
}

export interface UnpublishParams {
    context: PbContext;
    page: Page;
}

export interface NotFoundParams {
    context: PbContext;
    args: Record<string, any>;
}

interface Config {
    beforeCreate?: CallbackFunction<CreateParams>;
    afterCreate?: CallbackFunction<CreateParams>;
    beforeUpdate?: CallbackFunction<BeforeUpdateParams>;
    afterUpdate?: CallbackFunction<AfterUpdateParams>;
    beforeDelete?: CallbackFunction<DeleteParams>;
    afterDelete?: CallbackFunction<DeleteParams>;
    beforePublish?: CallbackFunction<PublishParams>;
    afterPublish?: CallbackFunction<PublishParams>;
    beforeUnpublish?: CallbackFunction<UnpublishParams>;
    afterUnpublish?: CallbackFunction<UnpublishParams>;
    notFound?: (params: NotFoundParams) => Promise<Page | undefined>;
}

export class PagePlugin extends Plugin {
    public static readonly type = "pb.page";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    beforeCreate(params: CreateParams): void | Promise<void> {
        return this._execute("beforeCreate", params);
    }

    afterCreate(params: CreateParams): void | Promise<void> {
        return this._execute("afterCreate", params);
    }

    beforeUpdate(params: BeforeUpdateParams): void | Promise<void> {
        return this._execute("beforeUpdate", params);
    }

    afterUpdate(params: AfterUpdateParams): void | Promise<void> {
        return this._execute("afterUpdate", params);
    }

    afterDelete(params: DeleteParams): void | Promise<void> {
        return this._execute("afterDelete", params);
    }

    beforeDelete(params: DeleteParams): void | Promise<void> {
        return this._execute("beforeDelete", params);
    }

    beforePublish(params: PublishParams): void | Promise<void> {
        return this._execute("beforePublish", params);
    }

    afterPublish(params: PublishParams): void | Promise<void> {
        return this._execute("afterPublish", params);
    }

    beforeUnpublish(params: UnpublishParams): void | Promise<void> {
        return this._execute("beforeUnpublish", params);
    }

    afterUnpublish(params: UnpublishParams): void | Promise<void> {
        return this._execute("afterUnpublish", params);
    }

    notFound(params: NotFoundParams): Promise<Page | undefined> {
        return this._execute("notFound", params);
    }

    private _execute(callback, params) {
        if (typeof this._config[callback] === "function") {
            return this._config[callback](params);
        }
    }
}
