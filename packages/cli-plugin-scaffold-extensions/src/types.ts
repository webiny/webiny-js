interface PluginGeneratorParams {
    input: {
        extensionName: string;
        packageName: string;
    };
}

export type PluginGenerator = (params: PluginGeneratorParams) => Promise<void>;
