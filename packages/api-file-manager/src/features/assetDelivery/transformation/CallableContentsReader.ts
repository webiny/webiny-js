import { AssetContentsReader } from "~/features/assetDelivery/abstractions/AssetContentsReader.js";

interface ContentsCallable {
    (): Promise<Buffer> | Buffer;
}

export class CallableContentsReader implements AssetContentsReader.Interface {
    private readonly callable: ContentsCallable;

    constructor(callable: ContentsCallable) {
        this.callable = callable;
    }

    async read(): Promise<Buffer> {
        return this.callable();
    }
}
