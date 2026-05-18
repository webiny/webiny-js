import type { FileUrl } from "@webiny/admin-ui";
import { FileUrlFormatter } from "./abstractions.js";

class FileManagerUrl implements FileUrl {
    private _width?: number;

    constructor(private readonly url: string | undefined) {}

    width(n: number): this {
        this._width = n;
        return this;
    }

    toString(): string {
        if (!this.url) {
            return "";
        }
        if (this._width !== undefined) {
            return `${this.url}?width=${this._width}`;
        }
        return this.url;
    }
}

class FileUrlFormatterImpl implements FileUrlFormatter.Interface {
    create(url: string | undefined): FileUrl {
        return new FileManagerUrl(url);
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: FileUrlFormatterImpl,
    dependencies: []
});
