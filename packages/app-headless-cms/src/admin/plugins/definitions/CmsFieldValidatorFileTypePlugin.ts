import { Plugin } from "@webiny/plugins/Plugin";

export interface Config {
    name: string;
}
export class CmsFieldValidatorFileTypePlugin extends Plugin {
    public static override readonly type: string = "cms-model-field-validator-fileType";

    private readonly config: Config;

    public constructor(config: Config) {
        super();
        this.config = config;
    }

    public getName(): string {
        return this.config.name;
    }
}
