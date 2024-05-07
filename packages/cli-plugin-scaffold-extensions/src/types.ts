interface PluginGeneratorParams {
    input: {
        name: string;
        packageName: string;
    };
}

export type PluginGenerator = (params: PluginGeneratorParams) => Promise<void>;
