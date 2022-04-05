import { Plugin } from "@webiny/plugins";

interface Config {
    type: string;
    factory: () => DataSource;
}

/**
 * Extend this class to implement your data sources.
 */
export abstract class DataSource<TLoadData = any, TContext = any> {
    abstract loadData(
        /**
         * Variables parsed from the requested URL
         */
        variables: Record<string, any>,
        /**
         * Data source config that was created via Page Builder settings UI
         */
        config: TLoadData,
        /**
         * Request context
         */
        context: TContext
    ): Promise<any>;
}

export class DataSourcePlugin extends Plugin {
    public static override readonly type: string = "dp.data-source";

    private _config: Config;

    constructor(config: Config) {
        super();
        this._config = config;
    }

    getType() {
        return this._config.type;
    }

    getDataSource() {
        return this._config.factory();
    }
}
