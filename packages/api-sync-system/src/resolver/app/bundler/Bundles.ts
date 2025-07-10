import type { IBundle, IBundles, IBundlesAddParams } from "~/resolver/app/bundler/types.js";
import type { IIngestorResultItem } from "~/resolver/app/ingestor/types.js";

export interface IBundlesParams {
    createBundle: (item: IIngestorResultItem) => IBundle;
}

export class Bundles implements IBundles {
    private readonly bundles: IBundle[] = [];
    private readonly createBundle: (item: IIngestorResultItem) => IBundle;

    public constructor(params: IBundlesParams) {
        this.createBundle = params.createBundle;
    }

    public add(params: IBundlesAddParams): void {
        const { item } = params;

        const bundle = this.getBundle(item);

        bundle.add(item);
    }

    public getBundles(): IBundle[] {
        return this.bundles;
    }

    private getBundle(item: IIngestorResultItem): IBundle {
        const last = this.bundles[this.bundles.length - 1];
        if (last?.canAdd(item)) {
            return last;
        }
        const bundle = this.createBundle(item);
        this.bundles.push(bundle);
        return bundle;
    }
}

export const createBundles = (params: IBundlesParams) => {
    return new Bundles(params);
};
