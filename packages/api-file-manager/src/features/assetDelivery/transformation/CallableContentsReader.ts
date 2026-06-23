import { AssetContentsReader } from "~/features/assetDelivery/abstractions/AssetContentsReader.js";

interface ContentsCallable {
    (): Promise<Buffer> | Buffer;
}

export class CallableContentsReader implements AssetContentsReader.Interface {
    private readonly callable: ContentsCallable;

    public static create(callable: ContentsCallable) {
        return new CallableContentsReader(callable);
    }

    private constructor(callable: ContentsCallable) {
        this.callable = callable;
    }

    public async read(): Promise<Buffer> {
        return this.callable();
    }
}
