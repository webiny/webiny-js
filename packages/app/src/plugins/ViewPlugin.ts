import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface Config<Props> {
    name: string;
    render(props: Props): React.ReactElement | null;
}

export class ViewPlugin<Props = any> extends Plugin {
    public static override readonly type: string = "view";
    private readonly _config: Partial<Config<Props>>;

    public constructor(config?: Config<Props>) {
        super();
        this._config = config || {};
    }

    get key() {
        return this._config.name;
    }

    public render(props: Props) {
        if (!this._config.render) {
            return null;
        }
        return this._config.render(props);
    }
}
