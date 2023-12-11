export interface ResolvedAssetData {
    id: string;
    tenant: string;
    locale: string;
    key: string;
    size: number;
    contentType: string;
}

export class ResolvedAsset {
    private readonly props: ResolvedAssetData;

    private constructor(props: ResolvedAssetData) {
        this.props = props;
    }

    static create(props: ResolvedAssetData) {
        return new ResolvedAsset(props);
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
        return this.getKey().split(".").pop();
    }
}
