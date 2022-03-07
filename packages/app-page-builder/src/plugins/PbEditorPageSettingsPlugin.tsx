import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface ConfigRenderProps {
    [key: string]: any;
}
interface Config {
    title: string;
    description: string;
    icon: React.ReactElement;
    render(props: ConfigRenderProps): React.ReactElement;
}

export class PbEditorPageSettingsPlugin extends Plugin {
    public static override readonly type: string = "pb-editor-page-settings";
    private readonly config: Config;

    public constructor(config: Config) {
        super();
        this.config = config;
    }

    get title(): string {
        return this.config.title;
    }

    get description(): string {
        return this.config.description;
    }

    get icon(): React.ReactElement {
        return this.config.icon;
    }

    render(props: ConfigRenderProps) {
        return this.config.render(props);
    }
}
