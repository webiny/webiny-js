import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface Config<Props> {
    name: string;
    render(props: Props): React.ReactElement | null;
}

export class ViewPlugin<Props = any> extends Plugin {
    public static readonly type = "view";
    private _config: Partial<Config<Props>>;

    constructor(config?: Config<Props>) {
        super();
        this._config = config || {};
    }

    get key() {
        return this._config.name;
    }

    render(props: Props) {
        return this._config.render(props);
    }
}
