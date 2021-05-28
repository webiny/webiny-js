import * as React from "react";

interface Config {
    title: string;
    description: string;
    icon: React.ReactElement<any>;
    render(props: any): React.ReactElement<any>;
}

export class PbEditorPageSettingsPlugin {
    type = "pb-editor-page-settings";
    config: Record<string, any>;

    constructor(config: Config) {
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
