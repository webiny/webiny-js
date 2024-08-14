interface PluginGeneratorParams {
    input: {
        name: string;
        location: string;
        packageName: string;
    };
}

export type PluginGenerator = (params: PluginGeneratorParams) => Promise<{
    nextSteps?: string[];
}>;

export interface Input {
    type: string;
    name: string;
    packageName: string;
    location: string;
    dependencies?: string;
    templateArgs?: string;
}

export interface DownloadedExtensionData {
    folderName: string;
    folderPath: string;
    packageJsonPath: string;
    extensionType: string | null;
}