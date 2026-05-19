import { FileUrlFormatter } from "webiny/admin/file-manager";
import type { FileUrl } from "@webiny/admin-ui";

class MyFileUrl implements FileUrl {
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
        const params = new URLSearchParams();
        if (this._width !== undefined) {
            params.set("my_width", String(this._width));
        }
        return `${this.url}?${params.toString()}`;
    }
}

class MyFileUrlFormatter implements FileUrlFormatter.Interface {
    create(url: string | undefined): FileUrl {
        return new MyFileUrl(url);
    }
}

export default FileUrlFormatter.createImplementation({
    implementation: MyFileUrlFormatter,
    dependencies: []
});
