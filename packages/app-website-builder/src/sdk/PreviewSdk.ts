import type { ResolveElementParams } from "~/sdk/ComponentResolver.js";
import type { Component, IContentSdk, Page, ResolvedComponent } from "~/sdk/types.js";

export class PreviewSdk implements IContentSdk {
    private liveSdk: IContentSdk;

    constructor(liveSdk: IContentSdk) {
        this.liveSdk = liveSdk;
    }

    async getPage(path: string): Promise<Page | null> {
        return this.liveSdk.getPage(path, { preview: true });
    }

    async listPages(): Promise<Page[]> {
        return this.liveSdk.listPages();
    }

    registerComponent(blueprint: Component): void {
        this.liveSdk.registerComponent(blueprint);
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        return this.liveSdk.resolveElement(params);
    }
}
