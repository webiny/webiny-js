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

export class FileManagerFileTypePlugin extends Plugin {
    public static override readonly type: string = "admin-file-manager-file-type";
    private readonly config: Partial<Config>;

    public constructor(config?: Config) {
        super();
        this.config = config || {};
    }

    get types(): string[] {
        return this.config.types || [];
    }

    get actions(): React.ComponentType[] {
        return this.config.actions || [];
    }

    public render(params: RenderParams): React.ReactNode {
        if (!this.config.render) {
            return null;
        }
        return this.config.render(params);
    }
}
