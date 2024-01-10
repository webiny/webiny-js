import { AssetContentsReader, AssetOutputStrategy } from "~/delivery";

type Setter<T> = (arg: T | undefined) => T;

export interface AssetData {
    id: string;
    tenant: string;
    locale: string;
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
        const clonedAsset = new Asset(structuredClone(this.props));
        clonedAsset.outputStrategy = this.outputStrategy;
        clonedAsset.contentsReader = this.contentsReader;
        return clonedAsset;
    }

    getId() {
        return this.props.id;
    }
    getTenant() {
        return this.props.tenant;
    }
    getLocale() {
        return this.props.locale;
    }
    getKey() {
        return this.props.key;
    }
    async getSize() {
        const buffer = await this.getContents();
        return buffer.length;
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
