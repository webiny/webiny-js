import { AssetContentsReader } from "~/features/assetDelivery/abstractions.js";
import { toSingleChunk } from "~/delivery/AssetDelivery/toSingleChunk.js";

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

    public async readStream(): Promise<AsyncIterable<Uint8Array>> {
        const contents = await this.read();
        return toSingleChunk(contents);
    }
}
