import { createAbstraction } from "@webiny/feature/admin";
import type { IEcommerceApi } from "~/ecommerce/index.js";
import type { EcommerceApiManifest } from "./EcommerceApiManifest.js";
import type { IEcommerceSettings } from "~/features/ecommerce/settings/types.js";

export interface IEcommerceApiProvider {
    addApiManifest(manifest: EcommerceApiManifest): void;
    getApiManifest(name: string): EcommerceApiManifest | undefined;
    getApiManifests(): EcommerceApiManifest[];
    getApi(name: string): Promise<IEcommerceApi | undefined>;
}

export const EcommerceApiProviderAbstraction =
    createAbstraction<IEcommerceApiProvider>("EcommerceApiProvider");

export interface IEcommerceSettingsLoader {
    (name: string): Promise<IEcommerceSettings | undefined>;
}

export class EcommerceApiProvider implements IEcommerceApiProvider {
    private apiManifests: Map<string, EcommerceApiManifest>;
    private readonly settingsLoader: IEcommerceSettingsLoader;

    constructor(settingsLoader: IEcommerceSettingsLoader) {
        this.settingsLoader = settingsLoader;
        this.apiManifests = new Map<string, EcommerceApiManifest>();
    }

    async getApi(name: string): Promise<IEcommerceApi | undefined> {
        const apiManifest = this.apiManifests.get(name);
        if (!apiManifest) {
            return undefined;
        }

        const settings = await this.settingsLoader(name);
        if (!settings) {
            throw new Error(`${name} is not configured!`);
        }

        return await apiManifest.getApi(settings);
    }

    getApiManifests() {
        return Array.from(this.apiManifests.values());
    }

    public getApiManifest(name: string): EcommerceApiManifest | undefined {
        const apiManifest = this.apiManifests.get(name);
        if (!apiManifest) {
            return undefined;
        }

        return apiManifest;
    }

    public addApiManifest(manifest: EcommerceApiManifest): void {
        this.apiManifests.set(manifest.getName(), manifest);
    }
}
