import * as React from "react";
import { Plugin } from "@webiny/plugins";
import { FileItem } from "@webiny/app-admin/types";

export interface RenderParams {
    file: FileItem;
    width?: number;
}

interface Config {
    types: string[];
    actions?: React.ComponentType<RenderParams>[];
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

    get actions(): React.ComponentType<RenderParams>[] {
        return this.config.actions || [];
    }

    public render(params: RenderParams): React.ReactNode {
        if (!this.config.render) {
            return null;
        }
        return this.config.render(params);
    }
}
