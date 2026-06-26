import type { AssetContentsReader, AssetOutputStrategy } from "~/delivery/index.js";

type Setter<T> = (arg: T | undefined) => T;

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

    public static create(props: AssetData) {
        return new Asset(props);
    }

    private constructor(props: AssetData) {
        this.props = props;
    }

    public clone() {
        return this.withProps(structuredClone(this.props));
    }

    public withProps(props: Partial<AssetData>) {
        const newAsset = Asset.create({ ...this.props, ...props });
        newAsset.contentsReader = this.contentsReader;
        newAsset.outputStrategy = this.outputStrategy;
        return newAsset;
    }

    public getId() {
        return this.props.id;
    }

    public getTenant() {
        return this.props.tenant;
    }

    public getKey() {
        return this.props.key;
    }

    public getSize() {
        return this.props.size;
    }

    public getContentType() {
        return this.props.contentType;
    }

    public getExtension() {
        return this.getKey().split(".").pop() ?? "";
    }

    public getContents() {
        if (!this.contentsReader) {
            throw Error(`Asset contents reader was not configured!`);
        }
        return this.contentsReader.read(this);
    }

    public setContentsReader(reader: AssetContentsReader) {
        this.contentsReader = reader;
    }

    public output() {
        if (!this.outputStrategy) {
            throw Error(`Asset output strategy was not configured!`);
        }

        return this.outputStrategy.output(this);
    }

    public setOutputStrategy(setter: Setter<AssetOutputStrategy> | AssetOutputStrategy) {
        if (typeof setter === "function") {
            this.outputStrategy = setter(this.outputStrategy);
        } else {
            this.outputStrategy = setter;
        }
    }
}
