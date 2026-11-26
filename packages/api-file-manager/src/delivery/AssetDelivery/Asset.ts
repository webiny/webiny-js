import type { AssetContentsReader, AssetOutputStrategy } from "~/delivery/index.js";

type Setter<T> = (arg: T | undefined) => T;

async function* toSingleChunk(contents: Buffer): AsyncIterable<Uint8Array> {
    yield contents;
}

export interface AssetData {
    id: string;
    tenant: string;
    key: string;
    size: number;
    contentType: string;
}

export class Asset {
    protected readonly props: AssetData;
    private outputStrategy: AssetOutputStrategy | undefined;
    private contentsReader: AssetContentsReader | undefined;

    constructor(props: AssetData) {
        this.props = props;
    }

    clone() {
        return this.withProps(structuredClone(this.props));
    }

    withProps(props: Partial<AssetData>) {
        const newAsset = new Asset({ ...this.props, ...props });
        newAsset.contentsReader = this.contentsReader;
        newAsset.outputStrategy = this.outputStrategy;
        return newAsset;
    }

    getId() {
        return this.props.id;
    }
    getTenant() {
        return this.props.tenant;
    }
    getKey() {
        return this.props.key;
    }
    getSize() {
        return this.props.size;
    }
    getContentType() {
        return this.props.contentType;
    }
    getExtension() {
        return this.getKey().split(".").pop() ?? "";
    }

    getContents() {
        if (!this.contentsReader) {
            throw Error(`Asset contents reader was not configured!`);
        }
        return this.contentsReader.read(this);
    }

    /**
     * The contents in chunks, read as the consumer pulls them when the reader can stream, else in
     * one chunk.
     */
    async getContentsStream(): Promise<AsyncIterable<Uint8Array>> {
        if (!this.contentsReader) {
            throw Error(`Asset contents reader was not configured!`);
        }
        if (this.contentsReader.readStream) {
            return this.contentsReader.readStream(this);
        }
        const contents = await this.contentsReader.read(this);
        return toSingleChunk(contents);
    }

    setContentsReader(reader: AssetContentsReader) {
        this.contentsReader = reader;
    }

    output() {
        if (!this.outputStrategy) {
            throw Error(`Asset output strategy was not configured!`);
        }

        return this.outputStrategy.output(this);
    }

    setOutputStrategy(setter: Setter<AssetOutputStrategy> | AssetOutputStrategy) {
        if (typeof setter === "function") {
            this.outputStrategy = setter(this.outputStrategy);
        } else {
            this.outputStrategy = setter;
        }
    }
}
