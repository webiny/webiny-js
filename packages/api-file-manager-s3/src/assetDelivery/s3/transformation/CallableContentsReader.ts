import { AssetContentsReader } from "@webiny/api-file-manager";

interface ContentsCallable {
    (): Promise<Buffer> | Buffer;
}

export class CallableContentsReader implements AssetContentsReader {
    private readonly callable: ContentsCallable;

    constructor(callable: ContentsCallable) {
        this.callable = callable;
    }

    async read(): Promise<Buffer> {
        return this.callable();
    }
}
