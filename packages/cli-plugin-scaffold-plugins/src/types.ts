interface PluginGeneratorParams {
    input: {
        pluginName: string;
        packageName: string;
    };
}

export type PluginGenerator = (params: PluginGeneratorParams) => Promise<void>;
