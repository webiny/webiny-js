import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface Config {
    route: React.ReactElement;
}

export class RoutePlugin extends Plugin {
    public static readonly type = "route";
    private _config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    get route(): Config["route"] {
        return this._config.route;
    }
}
