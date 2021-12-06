export interface PluginOptions {
    /**
     * Name of the plugin.
     * Used for example for logging purposes.
     */
    readonly name?: string;
}

export interface PluginBase {
    readonly name?: string;
    readonly type: string;
}

export abstract class Plugin implements PluginBase {
    public static readonly type: string;
    public readonly name?: string;

    constructor(options: PluginOptions) {
        if (!(this.constructor as typeof Plugin).type) {
            throw Error(`Missing "type" definition in "${this.constructor.name}"!`);
        }

        this.name = options.name;
    }

    get type() {
        return (this.constructor as typeof Plugin).type;
    }
}

export abstract class PluginWithConfig<TConfig> extends Plugin {
    public readonly name?: string;

    constructor(public readonly config: TConfig & PluginOptions) {
        super(config);
    }
}

export interface PluginConstructor<TPlugin extends Plugin = Plugin, TConfig extends {} = {}> {
    new (config: TConfig & PluginOptions): TPlugin;
    prototype: TPlugin;
    readonly type: string;
}

export type PluginInstance<T extends PluginConstructor> = T extends PluginConstructor<
    infer TPlugin,
    infer TConfig
>
    ? TPlugin & TConfig
    : never;

interface DefinePluginOptions {
    type: string;
}

export function definePlugin<T>(options: DefinePluginOptions) {
    const { type } = options;
    const plugin = class extends Plugin {
        public static readonly type = type;
        public readonly name?: string;

        constructor(config: T & PluginOptions) {
            super(config);
            Object.assign(this, config);
        }
    };

    return plugin as PluginConstructor<Plugin & T, T>;
}
