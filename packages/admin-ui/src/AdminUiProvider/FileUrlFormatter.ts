export interface FileUrl {
    width(n: number): this;
    toString(): string;
}

export interface FileUrlFormatter {
    create(url: string): FileUrl;
}

class PassthroughUrl implements FileUrl {
    constructor(private readonly url: string) {}
    width(_n: number): this {
        return this;
    }
    toString(): string {
        return this.url;
    }
}

export const defaultFileUrlFormatter: FileUrlFormatter = {
    create(url: string): FileUrl {
        return new PassthroughUrl(url);
    }
};
