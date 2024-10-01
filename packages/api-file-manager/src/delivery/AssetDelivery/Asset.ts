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
    getLocale() {
        return this.props.locale;
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
