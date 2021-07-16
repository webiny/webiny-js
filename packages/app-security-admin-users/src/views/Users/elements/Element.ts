import React from "react";

export interface ElementConfig extends Record<string, any> {
    shouldRender?(props: any): boolean;
}

export abstract class Element<T extends ElementConfig = ElementConfig> {
    protected _config: T;
    protected _id: string;

    constructor(id: string, config?: T) {
        this._id = id;
        this._config = config || ({} as T);
    }

    get id() {
        return this._id;
    }

    shouldRender(props) {
        if (typeof this._config.shouldRender === "function") {
            return this._config.shouldRender(props);
        }
        return true;
    }

    abstract render(props: any): React.ReactElement<any>;
}
