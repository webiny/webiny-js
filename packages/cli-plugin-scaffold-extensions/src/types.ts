interface PluginGeneratorParams {
    input: {
        name: string;
        packageName: string;
    };
}

export type PluginGenerator = (params: PluginGeneratorParams) => Promise<void>;

export interface Input {
    type: string;
    name: string;
    packageName: string;
    location: string;
    dependencies?: string;
    templateArgs?: string;
}
