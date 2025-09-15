import { BaseAppBundler } from "./BaseAppBundler";

export class AppBundler extends BaseAppBundler {
    constructor(params) {
        super();
        this.params = params;
    }

    async build() {
        const BundlerClass = await this.getBundlerClass();
        const bundler = new BundlerClass(this.params);
        return bundler.build();
    }

    async watch() {
        const Bundler = await this.getBundlerClass();
        return new Bundler(this.params).watch();
    }

    async getBundlerClass() {
        //eslint-disable-next-line import/dynamic-import-chunkname
        const { RspackBundler } = await import("./RspackBundler.js");
        return RspackBundler;
    }
}
