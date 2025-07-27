import type { IBundler, IBundlerBundleParams, IBundles } from "~/resolver/app/bundler/types.js";

export interface IBundlerParams {
    createBundles: () => IBundles;
}

export class Bundler implements IBundler {
    private readonly createBundles: () => IBundles;

    public constructor(params: IBundlerParams) {
        this.createBundles = params.createBundles;
    }

    public bundle(params: IBundlerBundleParams): IBundles {
        const { items } = params;

        const bundles = this.createBundles();

        for (const item of items) {
            bundles.add({
                item
            });
        }

        return bundles;
    }
}

export const createBundler = (params: IBundlerParams) => {
    return new Bundler(params);
};
