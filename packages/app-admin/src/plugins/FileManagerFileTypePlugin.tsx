import * as React from "react";
import { Plugin } from "@webiny/plugins";

interface File {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    createdOn: string;
    createdBy: {
        id: string;
    };
    [key: string]: any;
}

export interface RenderParams {
    file: File;
}

interface Config {
    types: string[];
    actions?: React.ComponentType<any>[];
    render(params: RenderParams): React.ReactNode;
}

interface FileDetails {
    actions: React.ComponentType<any>[];
}

export class FileManagerFileTypePlugin extends Plugin {
    public static readonly type = "admin-file-manager-file-type";
    private config: Partial<Config>;

    constructor(config?: Config) {
        super();
        this.config = config || {};
    }

    get types() {
        return this.config.types || [];
    }

    get fileDetails(): FileDetails {
        return {
            actions: this.config.actions || []
        };
    }

    render(params: RenderParams): React.ReactNode {
        return this.config.render(params);
    }
}
