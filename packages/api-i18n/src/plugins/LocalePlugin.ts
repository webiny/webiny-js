import { Plugin } from "@webiny/plugins";
import { I18NContext, I18NLocale } from "~/types";

/**
 * Parameters for beforeCreate event.
 */
export interface BeforeCreateParams {
    context: I18NContext;
    /**
     * Data to be inserted into the storage.
     */
    data: I18NLocale;
}
/**
 * Parameters for afterCreate event.
 */
export interface AfterCreateParams {
    context: I18NContext;
    /**
     * Data that was inserted into the storage.
     */
    data: I18NLocale;
    /**
     * Result of the storage operations create method.
     * Possibly changed something on the "data".
     */
    locale: I18NLocale;
}
/**
 * Parameters for beforeUpdate event.
 */
export interface BeforeUpdateParams {
    context: I18NContext;
    /**
     * Original locale from the storage.
     */
    original: I18NLocale;
    /**
     * Data to be updated to the storage.
     */
    data: I18NLocale;
}
/**
 * Parameters for afterUpdate event.
 */
export interface AfterUpdateParams {
    context: I18NContext;
    /**
     * Original locale from the storage.
     */
    original: I18NLocale;
    /**
     * Data that was updated in the storage.
     */
    data: I18NLocale;
    /**
     * Result of the storage operations update method.
     * Possibly changed something on the "data".
     */
    locale: I18NLocale;
}
/**
 * Parameters for beforeDelete event.
 */
export interface BeforeDeleteParams {
    context: I18NContext;
    /**
     * I18NLocale to be deleted from the storage.
     */
    locale: I18NLocale;
}
/**
 * Parameters for afterDelete event.
 */
export interface AfterDeleteParams {
    context: I18NContext;
    /**
     * I18NLocale that was deleted from the storage.
     */
    locale: I18NLocale;
}

interface Params {
    beforeCreate?: (params: BeforeCreateParams) => Promise<void>;
    afterCreate?: (params: AfterCreateParams) => Promise<void>;
    beforeUpdate?: (params: BeforeUpdateParams) => Promise<void>;
    afterUpdate?: (params: AfterUpdateParams) => Promise<void>;
    beforeDelete?: (params: BeforeDeleteParams) => Promise<void>;
    afterDelete?: (params: AfterDeleteParams) => Promise<void>;
}
export class LocalePlugin extends Plugin {
    public static readonly type = "i18n.locale";

    private readonly _config: Params;

    public constructor(config: Params) {
        super();
        this._config = config;
    }

    public async beforeCreate(params: BeforeCreateParams): Promise<void> {
        await this.execute("beforeCreate", params);
    }

    public async afterCreate(params: AfterCreateParams): Promise<void> {
        await this.execute("afterCreate", params);
    }

    public async beforeUpdate(params: BeforeUpdateParams): Promise<void> {
        await this.execute("beforeUpdate", params);
    }

    public async afterUpdate(params: AfterUpdateParams): Promise<void> {
        await this.execute("afterUpdate", params);
    }

    public async beforeDelete(params: BeforeDeleteParams): Promise<void> {
        await this.execute("beforeDelete", params);
    }

    public async afterDelete(params: AfterDeleteParams): Promise<void> {
        await this.execute("afterDelete", params);
    }

    private async execute(event: string, params: any): Promise<void> {
        if (!this._config[event]) {
            return;
        }
        await this._config[event](params);
    }
}
