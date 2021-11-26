import { Plugin } from "@webiny/plugins";
import { Page, PbContext } from "~/types";

export type CallbackFunction<TParams> = (params: TParams) => void | Promise<void>;

export interface UpdateInput {
    // TODO: add fields from GraphQL
    [key: string]: any;
}

export interface CreateParams<TPage> {
    context: PbContext;
    page: TPage;
}

export interface BeforeUpdateParams<TPage> {
    context: PbContext;
    existingPage: TPage;
    inputData: UpdateInput;
    updateData: Partial<TPage>;
}

export interface AfterUpdateParams<TPage> {
    context: PbContext;
    page: TPage;
    inputData: UpdateInput;
}

export interface DeleteParams<TPage> {
    context: PbContext;
    page: TPage;
    // TODO: @doitadrian - we need to get rid of these two parameters below as they're very DDB specific
    latestPage: TPage;
    publishedPage?: TPage;
}

export interface PublishParams<TPage> {
    context: PbContext;
    page: TPage;
    // TODO: @doitadrian - we need to get rid of these two parameters below as they're very DDB specific
    latestPage: TPage;
    publishedPage?: TPage;
}

export interface UnpublishParams<TPage> {
    context: PbContext;
    page: TPage;
}

export interface NotFoundParams {
    context: PbContext;
    args: Record<string, any>;
}

interface Config<TPage extends Page = Page> {
    beforeCreate?: CallbackFunction<CreateParams<TPage>>;
    afterCreate?: CallbackFunction<CreateParams<TPage>>;
    beforeUpdate?: CallbackFunction<BeforeUpdateParams<TPage>>;
    afterUpdate?: CallbackFunction<AfterUpdateParams<TPage>>;
    beforeDelete?: CallbackFunction<DeleteParams<TPage>>;
    afterDelete?: CallbackFunction<DeleteParams<TPage>>;
    beforePublish?: CallbackFunction<PublishParams<TPage>>;
    afterPublish?: CallbackFunction<PublishParams<TPage>>;
    beforeUnpublish?: CallbackFunction<UnpublishParams<TPage>>;
    afterUnpublish?: CallbackFunction<UnpublishParams<TPage>>;
    notFound?: (params: NotFoundParams) => Promise<TPage | undefined>;
}

export class PagePlugin<TPage extends Page = Page> extends Plugin {
    public static readonly type = "pb.page";
    private _config: Config<TPage>;

    constructor(config?: Config<TPage>) {
        super();
        this._config = config || {};
    }

    beforeCreate(params: CreateParams<TPage>): void | Promise<void> {
        return this._execute("beforeCreate", params);
    }

    afterCreate(params: CreateParams<TPage>): void | Promise<void> {
        return this._execute("afterCreate", params);
    }

    beforeUpdate(params: BeforeUpdateParams<TPage>): void | Promise<void> {
        return this._execute("beforeUpdate", params);
    }

    afterUpdate(params: AfterUpdateParams<TPage>): void | Promise<void> {
        return this._execute("afterUpdate", params);
    }

    afterDelete(params: DeleteParams<TPage>): void | Promise<void> {
        return this._execute("afterDelete", params);
    }

    beforeDelete(params: DeleteParams<TPage>): void | Promise<void> {
        return this._execute("beforeDelete", params);
    }

    beforePublish(params: PublishParams<TPage>): void | Promise<void> {
        return this._execute("beforePublish", params);
    }

    afterPublish(params: PublishParams<TPage>): void | Promise<void> {
        return this._execute("afterPublish", params);
    }

    beforeUnpublish(params: UnpublishParams<TPage>): void | Promise<void> {
        return this._execute("beforeUnpublish", params);
    }

    afterUnpublish(params: UnpublishParams<TPage>): void | Promise<void> {
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
