import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import type { FileUrl, FileUrlFormatter } from "@webiny/admin-ui";

class FileManagerUrl implements FileUrl {
    private _width?: number;

    constructor(private readonly url: string) {}

    width(n: number): this {
        this._width = n;
        return this;
    }

    toString(): string {
        if (this._width !== undefined) {
            return `${this.url}?width=${this._width}`;
        }
        return this.url;
    }
}

const fileManagerFileUrlFormatter: FileUrlFormatter = {
    create(url: string): FileUrl {
        return new FileManagerUrl(url);
    }
};

export const FileUrlFormatterModule = () => {
    return (
        <AdminConfig>
            <AdminConfig.FileUrlFormatter formatter={fileManagerFileUrlFormatter} />
        </AdminConfig>
    );
};
