import React from "react";
import { Plugin } from "@webiny/plugins";

interface Permission {
    name: string;
    [key: string]: any;
}

interface RenderParams {
    value: Permission[];
    onChange: (value: Permission[]) => void;
}

interface Config {
    render(props: RenderParams): React.ReactElement;
    system?: boolean;
}

export class PermissionRendererPlugin extends Plugin {
    public static override readonly type: string = "admin-app-permissions-renderer";
    private readonly _config: Partial<Config>;

    public constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    get system(): boolean {
        return Boolean(this._config.system);
    }

    public render(props: RenderParams): React.ReactElement | null {
        if (!this._config.render) {
            return null;
        }
        return this._config.render(props);
    }
}
