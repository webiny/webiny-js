import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface Config {
    title: string;
    description: string;
    icon: React.ReactElement<any>;
    render(props: any): React.ReactElement<any>;
}

export class PbEditorPageSettingsPlugin extends Plugin {
    public static readonly type = "pb-editor-page-settings";
    config: Config;

    constructor(config: Config) {
        super();
        this.config = config;
    }

    get title() {
        return this.config.title;
    }

    get description() {
        return this.config.description;
    }

    get icon() {
        return this.config.icon;
    }

    render(props) {
        return this.config.render(props);
    }
}
