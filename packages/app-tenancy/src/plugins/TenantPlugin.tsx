import React from "react";
import { Plugin } from "@webiny/plugins";

export class TenantPlugin extends Plugin {
    public static readonly type = "tenancy.tenant";
    private _component: React.ComponentType;

    constructor(component: React.ComponentType) {
        super();
        this._component = component;
        if (!this._component.displayName) {
            this._component.displayName = `TenantPlugin`;
        }
    }

    render(): React.ReactElement {
        return React.createElement(this._component, { key: this.name });
    }
}
