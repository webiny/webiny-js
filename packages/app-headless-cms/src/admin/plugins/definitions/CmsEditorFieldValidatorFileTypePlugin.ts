import { Plugin } from "@webiny/plugins/Plugin";

export interface Config {
    name: string;
    message: string;
    label: string;
}
export interface Settings {
    fileType: "all" | "image" | "document" | string;
}
export class CmsEditorFieldValidatorFileTypePlugin extends Plugin {
    public static override readonly type: string = "cms-editor-field-validator-fileType";

    private readonly config: Config;
    private _settings: Settings | undefined;

    public set settings(settings: Settings) {
        this.setSettings(settings);
    }

    public get settings(): Settings {
        return this._settings as Settings;
    }

    public constructor(config: Config) {
        super();
        this.config = config;
    }

    public getName(): string {
        return this.config.name;
    }

    public getLabel(): string {
        return this.config.label;
    }

    public getMessage(): string {
        return this.config.message;
    }

    private setSettings(settings: Settings): void {
        this._settings = settings;
    }
}
