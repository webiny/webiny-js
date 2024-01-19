export interface ProcessParams {
    projectApplication: any;
    paths: {
        pluginsFolderPath: string;
        legacyPluginsFilePath: string;
        reactPluginsFilePath: string;
    }
    tsMorphProject: {
        legacyPluginsFile: any;
        reactPluginsFile: any;
        project: any;
    };
    projectConfig: any;

}

export abstract class WebsiteAppProcessor {
    abstract process(params: ProcessParams): void | Promise<void>;
}

