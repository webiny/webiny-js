import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface Config {
    route: React.ReactElement | null;
}

export class RoutePlugin extends Plugin {
    public static override readonly type: string = "route";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    get route(): Config["route"] {
        if (!this._config.route) {
            return null;
        }
        return this._config.route;
    }
}
