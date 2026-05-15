export interface FileUrl {
    width(n: number): this;
    toString(): string;
}

export interface FileUrlFormatter {
    create(url: string | undefined): FileUrl;
}

class PassthroughUrl implements FileUrl {
    constructor(private readonly url: string | undefined) {}
    width(_n: number): this {
        return this;
    }
    toString(): string {
        return this.url ?? "";
    }
}

export const defaultFileUrlFormatter: FileUrlFormatter = {
    create(url: string | undefined): FileUrl {
        return new PassthroughUrl(url);
    }
};

import React from "react";

export const FileUrlFormatterContext =
    React.createContext<FileUrlFormatter>(defaultFileUrlFormatter);
